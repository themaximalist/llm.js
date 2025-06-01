import ModelUsage from "./ModelUsage.ts";
import type { ModelUsageType } from "./ModelUsage.ts";
import config from "./config.ts";
import { parseStream, handleErrorResponse } from "./utils.ts";

export type ServiceName = "anthropic" | "ollama";

export interface Options {
    service?: ServiceName;
    messages?: Message[];
    model?: string;
    baseUrl?: string;
    apiKey?: string;
    stream?: boolean;
    max_tokens?: number;
    extended?: boolean;
}

export interface InputOutputTokens {
    input_tokens: number;
    output_tokens: number;
}

export interface Usage extends InputOutputTokens {
    total_tokens: number;
    local: boolean;
}

export interface Response {
    content: string;
    options: Options;
    messages: Message[];
    usage: Usage;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
    role: MessageRole;
    content: string;
}

export type Input = string | Message[];

export type Model = ModelUsageType & {
    name?: string;
    created?: Date;
    raw?: any;
}

export default class LLM {
    static readonly service: ServiceName;
    static readonly DEFAULT_BASE_URL: string;
    static readonly isLocal: boolean = false;

    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;
    modelUsage: ModelUsageType[];
    stream?: boolean;
    max_tokens?: number;
    extended?: boolean;

    constructor(input?: Input, options: Options = {}) {
        const LLM = this.constructor as typeof LLM;

        this.messages = [];
        if (input && typeof input === "string") this.user(input);
        else if (input && Array.isArray(input)) this.messages = input;
        this.options = options;
        this.model = options.model ?? LLM.DEFAULT_MODEL;
        this.baseUrl = options.baseUrl ?? LLM.DEFAULT_BASE_URL;
        this.modelUsage = ModelUsage.get(this.service);
        this.stream = options.stream ?? false;
        this.max_tokens = options.max_tokens ?? config.max_tokens;
        this.extended = options.extended ?? false;
    }

    get service() { return (this.constructor as typeof LLM).service }
    get isLocal() { return (this.constructor as typeof LLM).isLocal }
    get apiKey() { return this.options.apiKey || process?.env?.[`${this.service.toUpperCase()}_API_KEY`] }
    get llmOptions(): Options {
        return this.parseOptions({
            model: this.model,
            messages: this.messages,
            stream: this.stream,
            max_tokens: this.max_tokens,
        });
    }

    get llmHeaders() {
        return {
            "x-api-key": this.apiKey,
        }
    }

    get chatUrl() { return `${this.baseUrl}/api/chat` }
    get modelsUrl() { return `${this.baseUrl}/api/tags` }

    addMessage(role: MessageRole, content: string) { this.messages.push({ role, content }) }
    user(content: string) { this.addMessage("user", content) }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }

    async chat(input: string, options?: Options): Promise<string | AsyncGenerator<string> | Response> {
        this.user(input);
        return await this.send(options);
    }

    async send(options?: Options): Promise<string | AsyncGenerator<string> | Response> {
        const opts = { ...this.llmOptions, ...this.parseOptions(options || {}) };
        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(opts),
            headers: this.llmHeaders,
        } as RequestInit);

        await handleErrorResponse(response);

        if (this.stream) {
            const body = response.body;
            if (!body) throw new Error("No body found");
            return this.streamResponse(body);
        }

        const data = await response.json();
        const content = this.parseContent(data);
        this.assistant(content);

        if (this.extended) {
            return this.parseExtendedResponse(content, data, opts);
        }

        return content;
    }

    async *streamResponse(stream: ReadableStream): AsyncGenerator<string> {
        const reader = await parseStream(stream);
        let buffer = "";
        for await (const chunk of reader) {
            const content = this.parseChunkContent(chunk);
            buffer += content;
            yield content;
        }
        if (buffer.length > 0) this.assistant(buffer);
    }

    async fetchModels(): Promise<Model[]> {
        const options = { headers: this.llmHeaders } as RequestInit;
        const response = await fetch(this.modelsUrl, options);
        await handleErrorResponse(response);

        const data = await response.json();
        const models = data.models ?? data.data;
        if (!models) throw new Error("No models found");
        return models.map(this.parseModel);
    }

    async verifyConnection(): Promise<boolean> { return (await this.fetchModels()).length > 0 }

    async getModels(): Promise<Model[]> {
        const models = await this.fetchModels();
        return models.map(model => {
            const usage = this.modelUsage.find(usage => usage.model === model.model) || {} as ModelUsageType;
            if (this.isLocal) {
                usage.input_cost_per_token = 0;
                usage.output_cost_per_token = 0;
                usage.output_cost_per_reasoning_token = 0;
            }
            return { ...usage, name: model.name, model: model.model, created: model.created, service: this.service, raw: model } as Model;
        });
    }

    async refreshModelUsage(): Promise<void> {
        this.modelUsage = await ModelUsage.refresh()
    }

    parseContent(data: any): string { throw new Error("Not implemented") }
    parseChunkContent(chunk: any): string { throw new Error("Not implemented") }
    parseModel(model: any): Model { throw new Error("Not implemented") }
    parseOptions(options: Options): Options { return options }
    parseUsage(usage: any): InputOutputTokens { return usage }
    parseExtendedResponse(content: string, data: any, options: Options): Response {
        const usage = this.parseUsage(data);

        return {
            content,
            options,
            messages: JSON.parse(JSON.stringify(this.messages)),
            usage: { ...usage, local: this.isLocal, total_tokens: usage.input_tokens + usage.output_tokens }
        };
    }


    static async create(input: Input, options: Options = {}): Promise<string | AsyncGenerator<string> | Response> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}