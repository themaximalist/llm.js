import ModelUsage from "./ModelUsage";
import type { ModelUsageType } from "./ModelUsage";
import config from "./config";
import * as parsers from "./parsers";
import { parseStream, handleErrorResponse } from "./utils";
import type {
    ServiceName, Options, InputOutputTokens, Usage, Response, PartialStreamResponse, StreamResponse,
    Message, Parsers, Input, Model, MessageRole, ParserResponse, Tool, MessageContent, ToolCall, StreamingToolCall } from "./LLM.types";
import { EventEmitter } from "events";

export default class LLM {
    static parsers = parsers;
    static readonly service: ServiceName;
    static DEFAULT_BASE_URL: string;
    static DEFAULT_MODEL: string;
    static isLocal: boolean = false;
    static isBearerAuth: boolean = false;

    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;
    modelUsage: ModelUsageType[];
    stream?: boolean;
    max_tokens?: number;
    max_thinking_tokens?: number;
    extended?: boolean;
    think?: boolean;
    temperature?: number;
    parser?: ParserResponse;
    json?: boolean;
    tools?: Tool[];
    eventEmitter: EventEmitter;
    protected cache: Record<string, any> = {};

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
        this.eventEmitter = new EventEmitter();
        if (typeof options.temperature === "number") this.temperature = options.temperature;
        if (typeof options.max_thinking_tokens === "number") this.max_thinking_tokens = options.max_thinking_tokens;
        if (typeof options.parser === "string") this.parser = this.parsers[options.parser];
        if (typeof options.json === "boolean") this.json = options.json;
        if (this.json && !this.parser) this.parser = parsers.json;
        if (Array.isArray(options.tools)) this.tools = options.tools as Tool[];
        if (this.think) this.extended = true;
        if (this.tools && this.tools.length > 0) this.extended = true;
    }

    get service() { return (this.constructor as typeof LLM).service }
    get isLocal() { return (this.constructor as typeof LLM).isLocal }
    get apiKey() { return this.options.apiKey || process?.env?.[`${this.service.toUpperCase()}_API_KEY`] }
    get llmOptions(): Options {
        const options = {
            model: this.model,
            messages: this.messages,
            stream: this.stream,
            max_tokens: this.max_tokens,
            think: this.think,
        } as Options;
        if (typeof this.max_thinking_tokens === "number") options.max_thinking_tokens = this.max_thinking_tokens;
        if (typeof this.temperature === "number") options.temperature = this.temperature;
        if (this.tools) options.tools = this.tools;
        return options;
    }

    get llmHeaders() {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if ((this.constructor as typeof LLM).isBearerAuth) headers["Authorization"] = `Bearer ${this.apiKey}`;
        else if (this.apiKey) headers["x-api-key"] = this.apiKey;
        return headers;
    }

    get chatUrl() { return `${this.baseUrl}/api/chat` }
    get modelsUrl() { return `${this.baseUrl}/api/tags` }
    get parsers(): Parsers {
        return {
            content: this.parseChunkContent.bind(this),
            thinking: this.parseThinkingChunk.bind(this),
            usage: this.parseTokenUsage.bind(this),
            tool_calls: this.parseToolsChunk.bind(this),
        }
    }

    addMessage(role: MessageRole, content: MessageContent) { this.messages.push({ role, content }) }
    user(content: string) { this.addMessage("user", content) }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }
    thinking(content: string) { this.addMessage("thinking", content) }
    toolCall(tool: ToolCall) { this.addMessage("tool_call", tool) }

    async chat(input: string, options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        this.user(input);
        return await this.send(options);
    }

    abort() { this.eventEmitter.emit('abort') }

    async send(options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const vanillaOptions = { ...this.llmOptions, ...options || {} };
        const opts = this.parseOptions(JSON.parse(JSON.stringify(vanillaOptions)));

        this.resetCache();

        if (opts.tools && opts.tools.length > 0) this.extended = true;

        console.log("OPTS", opts);
        console.log("HEADERS", this.llmHeaders);

        const signal = new AbortController();
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

    response(data: any) : string {
        let content = this.parseContent(data);
        if (this.parser) content = this.parser(content) as string;

        if (content) this.assistant(content);
        return content;
    }

    protected extendedResponse(data: any, options: Options): Response {
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

        let content = this.parseContent(data);
        if (this.parser) content = this.parser(content) as string;
        if (content) this.assistant(content);

        if (this.tools && this.tools.length > 0) {
            response.tool_calls = this.parseTools(data) as ToolCall[];
            for (const tool of response.tool_calls) {
                if (tool && Object.keys(tool).length > 0) { this.toolCall(tool) }
            }
        }

        response.content = content;
        response.messages = JSON.parse(JSON.stringify(this.messages));

        return response;
    }

    protected async *streamResponse(stream: ReadableStream): AsyncGenerator<string> {
        const restream = this.streamResponses(stream, { content: this.parseChunkContent.bind(this) });
        for await (const chunk of restream) {
            if (chunk.type === "content") {
                yield chunk.content as string;
            }
        }
    }

    protected async *streamResponses(stream: ReadableStream, parsers: Parsers): AsyncGenerator<Record<string, string | InputOutputTokens | ToolCall[]>> {
        const reader = await parseStream(stream);
        let buffers : Record<string, string | InputOutputTokens | ToolCall[] | StreamingToolCall> = { "type": "buffers" };;
        for await (const chunk of reader) {
            for (const [name, parser] of Object.entries(parsers)) {
                const content = parser(chunk);
                if (!content) continue;

                if (name === "usage") {
                    buffers[name] = content as InputOutputTokens;
                    yield { type: name, content: content as InputOutputTokens };
                } else if (name === "tool_calls") {
                    if (!Array.isArray(content) || content.length === 0) continue;

                    if (!buffers[name]) buffers[name] = [];
                    (buffers[name] as ToolCall[]).push(...content as unknown as ToolCall[]);
                    yield { type: name, content: content as unknown as ToolCall[] };
                } else {
                    if (!buffers[name]) buffers[name] = "";
                    buffers[name] += content as string;
                    yield { type: name, content: content as string };
                }
            }
        }

        for (let [name, content] of Object.entries(buffers)) {
            if (name === "thinking") {
                this.thinking(content as string);
            } else if (name === "tool_calls") {
                for (const tool of content as unknown as ToolCall[]) {
                    if (tool && Object.keys(tool).length > 0) { this.toolCall(tool) }
                }
            } else if (name === "content") {
                if (this.parser) {
                    content = this.parser(content) as string;
                    buffers[name] = content;
                }
                if (content) this.assistant(content as string);
            }
        }

        return buffers;
    }

    protected async *restream(stream: AsyncGenerator<Record<string, string | InputOutputTokens>>, callback?: (chunk: Record<string, string | InputOutputTokens>) => void): AsyncGenerator<Record<string, string | InputOutputTokens>> {
        while (true) {
            const { value, done } = await stream.next();
            if (callback && value) callback(value);
            if (done) break;
            yield value;
        }
    }

    protected extendedStreamResponse(body: ReadableStream, options: Options): PartialStreamResponse {
        let usage: Usage;

        let thinking = "";
        let content = "";
        let tool_calls: ToolCall[] = [];

        const complete = async (): Promise<StreamResponse> => {
            const messages = JSON.parse(JSON.stringify(this.messages));
            const response = { service: this.service, options, usage, messages, content } as StreamResponse;
            if (thinking) response.thinking = thinking;
            if (tool_calls.length > 0) response.tool_calls = tool_calls;

            return response;
        }

        const stream = this.streamResponses(body, this.parsers);
        const restream = this.restream(stream as AsyncGenerator<Record<string, string | InputOutputTokens>>, (chunk) => {
            if (chunk.type === "usage" && chunk.content && typeof chunk.content === "object") {
                const tokenUsage = chunk.content as InputOutputTokens;
                usage = this.parseUsage(tokenUsage);
            }

            if (chunk.type === "tool_calls" && chunk.content && Array.isArray(chunk.content)) {
                tool_calls.push(...chunk.content as unknown as ToolCall[]);
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

    protected parseContent(data: any): string { throw new Error("parseContent not implemented") }
    protected parseTools(data: any): ToolCall[] { return [] }
    protected parseToolsChunk(chunk: any): ToolCall[] { return this.parseTools(chunk) }
    protected parseChunkContent(chunk: any): string { throw new Error("parseChunkContent not implemented") }
    protected parseThinking(data: any): string { return "" }
    protected parseThinkingChunk(chunk: any): string { return this.parseThinking(chunk) }
    protected parseModel(model: any): Model { throw new Error("parseModel not implemented") }
    protected parseOptions(options: Options): Options {
        if (!options) return {};
        return options;
    }
    protected parseTokenUsage(usage: any): InputOutputTokens | null { return usage }
    protected parseUsage(tokenUsage: InputOutputTokens): Usage {
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

    protected resetCache() {
        this.cache = {};
    }
}

export type LLMConstructor = typeof LLM;