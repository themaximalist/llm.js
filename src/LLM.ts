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
    think?: boolean;
}

export interface InputOutputTokens {
    input_tokens: number;
    output_tokens: number;
}

export interface Usage extends InputOutputTokens {
    total_tokens: number;
    local: boolean;
    input_cost: number;
    output_cost: number;
    total_cost: number;
}

export interface Response {
    service: ServiceName;
    content: string;
    options: Options;
    messages: Message[];
    thinking?: string;
    usage: Usage;
}

export interface PartialStreamResponse {
    service: ServiceName;
    think: boolean;
    options: Options;
    stream: AsyncGenerator<string>;
    complete: () => Promise<StreamResponse>;
}

export interface StreamResponse extends Response {
    think: boolean;
}

export type MessageRole = "user" | "assistant" | "system" | "thinking";

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
    static DEFAULT_BASE_URL: string;
    static isLocal: boolean = false;

    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;
    modelUsage: ModelUsageType[];
    stream?: boolean;
    max_tokens?: number;
    extended?: boolean;
    think?: boolean;

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
        this.think = options.think ?? false;
        if (this.think) this.extended = true;
    }

    get service() { return (this.constructor as typeof LLM).service }
    get isLocal() { return (this.constructor as typeof LLM).isLocal }
    get apiKey() { return this.options.apiKey || process?.env?.[`${this.service.toUpperCase()}_API_KEY`] }
    get llmOptions(): Options {
        return {
            model: this.model,
            messages: this.messages,
            stream: this.stream,
            max_tokens: this.max_tokens,
            think: this.think,
        };
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
    thinking(content: string) { this.addMessage("thinking", content) }

    async chat(input: string, options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        this.user(input);
        return await this.send(options);
    }

    async send(options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const vanillaOptions = { ...this.llmOptions, ...options || {} };
        const opts = this.parseOptions(JSON.parse(JSON.stringify(vanillaOptions)));

        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(opts),
            headers: this.llmHeaders,
        } as RequestInit);

        await handleErrorResponse(response, "Failed to send request");

        if (this.stream) {
            const body = response.body;
            if (!body) throw new Error("No body found");
            if (this.extended) {
                return this.parseExtendedStreamResponse(body, vanillaOptions);
            }
            return this.streamResponse(body);
        }

        const data = await response.json();

        if (this.extended) {
            return this.parseExtendedResponse(data, vanillaOptions);
        }

        const content = this.parseContent(data);
        this.assistant(content);

        return content;
    }

    async *streamResponse(stream: ReadableStream, parser?: (chunk: string) => string): AsyncGenerator<string> {
        if (!parser) parser = this.parseChunkContent;

        const reader = await parseStream(stream);
        let buffer = "";
        for await (const chunk of reader) {
            const content = parser(chunk);
            buffer += content;
            yield content;
        }
        if (buffer.length > 0) this.assistant(buffer);
    }

    async fetchModels(): Promise<Model[]> {
        const options = { headers: this.llmHeaders } as RequestInit;
        const response = await fetch(this.modelsUrl, options);
        await handleErrorResponse(response, "Failed to fetch models");

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
    parseOptions(options: Options): Options {
        if (!options) return {};
        return options;
    }
    parseThinking(data: any): string | null { return null }
    parseTokenUsage(usage: any): InputOutputTokens { return usage }
    parseUsage(tokenUsage: InputOutputTokens): Usage {
        const modelUsage = this.modelUsage.find(m => m.model === this.model);
        let inputCostPerToken = modelUsage?.input_cost_per_token || 0;
        let outputCostPerToken = modelUsage?.output_cost_per_token || 0;

        if (this.isLocal) {
            inputCostPerToken = 0;
            outputCostPerToken = 0;
        }

        const input_cost = tokenUsage.input_tokens * inputCostPerToken;
        const output_cost = tokenUsage.output_tokens * outputCostPerToken;
        const total_cost = input_cost + output_cost;

        return {
            ...tokenUsage,
            local: this.isLocal,
            total_tokens: tokenUsage.input_tokens + tokenUsage.output_tokens,
            input_cost,
            output_cost,
            total_cost,
        }
    }

    parseExtendedResponse(data: any, options: Options): Response {
        const tokenUsage = this.parseTokenUsage(data);
        const usage = this.parseUsage(tokenUsage);

        const response = {
            service: this.service,
            options,
            usage,
        } as Response;

        if (options.think) {
            const thinking = this.parseThinking(data);
            if (thinking) {
                response.thinking = thinking;
                this.thinking(thinking);
            }
        }

        response.content = this.parseContent(data);
        this.assistant(response.content);

        response.messages = JSON.parse(JSON.stringify(this.messages));

        return response;
    }

    parseExtendedStreamResponse(body: ReadableStream, options: Options): PartialStreamResponse {
        let usage: Usage;

        const complete = async (): Promise<StreamResponse> => {
            const messages = JSON.parse(JSON.stringify(this.messages));
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role !== "assistant") throw new Error("No assistant message found");
            return { service: this.service, options, usage, messages, content: lastMessage.content, think: this.think ?? false }
        }

        const stream = this.streamResponse(body, (chunk) => {
            const tokenUsage = this.parseTokenUsage(chunk);
            if (tokenUsage.input_tokens && tokenUsage.output_tokens) usage = this.parseUsage(tokenUsage);
            return this.parseChunkContent(chunk);
        });

        return { service: this.service, options, stream, complete, think: this.think ?? false }
    }


    static async create(input: Input, options: Options = {}): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}