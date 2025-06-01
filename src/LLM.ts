import ModelUsage from "./ModelUsage";
import type { ModelUsageType } from "./ModelUsage";
import config from "./config";
import { parseStream, handleErrorResponse } from "./utils";
import type { ServiceName, Options, InputOutputTokens, Usage, Response, PartialStreamResponse, StreamResponse, Message, Parsers, Input, Model, MessageRole } from "./LLM.types";
import { EventEmitter } from "events";

export default class LLM {
    static readonly service: ServiceName;
    static DEFAULT_BASE_URL: string;
    static DEFAULT_MODEL: string;
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
    eventEmitter: EventEmitter;

    constructor(input?: Input, options: Options = {}) {
        const LLM = this.constructor as LLMConstructor;

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
        this.eventEmitter = new EventEmitter();
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
    get parsers(): Parsers {
        return {
            content: this.parseChunkContent.bind(this),
            thinking: this.parseThinkingChunk.bind(this),
            usage: this.parseTokenUsage.bind(this),
        }
    }

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

        const signal = new AbortController();
        // if (options.eventEmitter) {
        //     options.eventEmitter.on('abort', () => signal.abort());
        // }

        this.eventEmitter.on('abort', () => signal.abort());

        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(opts),
            headers: this.llmHeaders,
            signal: signal.signal,
        } as RequestInit);

        await handleErrorResponse(response, "Failed to send request");

        if (this.stream) {
            const body = response.body;
            if (!body) throw new Error("No body found");
            if (this.extended) return this.extendedStreamResponse(body, vanillaOptions);
            return this.streamResponse(body);
        }

        const data = await response.json();

        if (this.extended) return this.extendedResponse(data, vanillaOptions);
        return this.response(data);
    }

    async response(data: any): Promise<string> {
        const content = this.parseContent(data);
        this.assistant(content);
        return content;
    }

    extendedResponse(data: any, options: Options): Response {
        const response = {
            service: this.service,
            options,
        } as Response;

        const tokenUsage = this.parseTokenUsage(data);
        if (tokenUsage) {
            response.usage = this.parseUsage(tokenUsage);
        }

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

    async *streamResponse(stream: ReadableStream): AsyncGenerator<string> {
        const restream = this.streamResponses(stream, { content: this.parseChunkContent.bind(this) });
        for await (const chunk of restream) {
            if (chunk.type === "content") {
                yield chunk.content as string;
            }
        }
    }

    async *streamResponses(stream: ReadableStream, parsers: Parsers): AsyncGenerator<Record<string, string | InputOutputTokens>> {
        const reader = await parseStream(stream);
        let buffers : Record<string, string> = { "type": "buffers" };;
        for await (const chunk of reader) {
            for (const [name, parser] of Object.entries(parsers)) {
                const content = parser(chunk);
                if (!content) continue;

                if (!buffers[name]) buffers[name] = "";
                buffers[name] += content;

                if (name === "usage") {
                    yield { type: name, content: content as InputOutputTokens };
                } else {
                    yield { type: name, content: content as string };
                }
            }
        }

        for (const [name, content] of Object.entries(buffers)) {
            if (name === "thinking") this.thinking(content);
            else if (name === "content") this.assistant(content);
        }

        return buffers;
    }

    async *restream(stream: AsyncGenerator<Record<string, string | InputOutputTokens>>, callback?: (chunk: Record<string, string | InputOutputTokens>) => void): AsyncGenerator<Record<string, string | InputOutputTokens>> {
        while (true) {
            const { value, done } = await stream.next();
            if (callback && value) callback(value);
            if (done) break;
            yield value;
        }
    }

    abort() {
        this.eventEmitter.emit('abort');
    }

    extendedStreamResponse(body: ReadableStream, options: Options): PartialStreamResponse {
        let usage: Usage;

        let thinking = "";
        let content = "";

        const complete = async (): Promise<StreamResponse> => {
            if (!content) throw new Error("No content found");
            if (options.think && !thinking) throw new Error("No thinking found");

            const messages = JSON.parse(JSON.stringify(this.messages));
            const response = { service: this.service, options, usage, messages, content } as StreamResponse;
            if (thinking) response.thinking = thinking;

            return response;
        }

        const stream = this.streamResponses(body, this.parsers);
        const restream = this.restream(stream, (chunk) => {
            if (chunk.type === "usage" && chunk.content && typeof chunk.content === "object") {
                const tokenUsage = chunk.content as InputOutputTokens;
                usage = this.parseUsage(tokenUsage);
            }

            if (chunk.type !== "buffers") return;
            if (chunk.thinking) thinking = chunk.thinking as string;
            if (chunk.content) content = chunk.content as string;
        });

        return { service: this.service, options, stream: restream, complete, think: this.think ?? false }
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
    parseThinking(data: any): string { return "" }
    parseThinkingChunk(chunk: any): string { return this.parseThinking(chunk) }
    parseModel(model: any): Model { throw new Error("Not implemented") }
    parseOptions(options: Options): Options {
        if (!options) return {};
        return options;
    }
    parseTokenUsage(usage: any): InputOutputTokens | null { return usage }
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



    static async create(input: Input, options: Options = {}): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}

export type LLMConstructor = typeof LLM;