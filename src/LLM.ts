import logger from './logger';
const log = logger("llm.js:index");

import ModelUsage from "./ModelUsage";
import Attachment from "./Attachment";
import type { ModelUsageType } from "./ModelUsage";
import config from "./config";
import * as parsers from "./parsers";
import { parseStream, handleErrorResponse, isBrowser, isNode, join, deepClone, wrapTool } from "./utils";
import type {
    ServiceName, Options, InputOutputTokens, Usage, Response, PartialStreamResponse, StreamResponse, QualityFilter,
    Message, Parsers, Input, Model, MessageRole, ParserResponse, Tool, MessageContent, ToolCall, StreamingToolCall, ToolResult, ToolFunction } from "./LLM.types";

/**
 * LLM Base Class
 * 
 * @category LLMs
 */
export default class LLM {
    static parsers = parsers;
    static readonly service: ServiceName;
    static DEFAULT_BASE_URL: string;
    static DEFAULT_MODEL: string;
    static isLocal: boolean = false;
    static isBearerAuth: boolean = false;
    static MessageExtendedContentInputKey: string = "text";

    service: ServiceName;
    messages: Message[];
    model: string;
    baseUrl: string;
    options: Options;
    modelUsage: ModelUsage;
    stream: boolean;
    max_tokens: number;
    max_thinking_tokens?: number;
    extended: boolean;
    think: boolean;
    temperature?: number;
    parser?: ParserResponse;
    json?: boolean;
    tools?: Tool[];
    qualityFilter: QualityFilter;
    runSteps: number;
    protected abortController: AbortController | null = null;
    protected cache: Record<string, any> = {};

    constructor(input?: Input | Options, options: Options = {}) {
        const LLM = this.constructor as LLMConstructor;

        this.service = options.service ?? (this.constructor as typeof LLM).service;
        this.messages = [];
        if (input && typeof input === "string") this.user(input, options.attachments);
        else if (input && Array.isArray(input)) this.messages = input;
        this.options = options;
        this.model = options.model ?? LLM.DEFAULT_MODEL;
        this.baseUrl = options.baseUrl ?? LLM.DEFAULT_BASE_URL;
        this.modelUsage = new ModelUsage(this.service);
        this.stream = options.stream ?? false;
        this.max_tokens = options.max_tokens ?? config.max_tokens;
        this.extended = options.extended ?? false;
        this.think = options.think ?? false;
        this.qualityFilter = options.qualityFilter ?? {};
        this.runSteps = options.runSteps ?? 10;

        if (typeof options.temperature === "number") this.temperature = options.temperature;
        if (typeof options.max_thinking_tokens === "number") this.max_thinking_tokens = options.max_thinking_tokens;
        if (typeof options.parser === "string") this.parser = this.parsers[options.parser];
        if (typeof options.json === "boolean") this.json = options.json;
        if (this.json && !this.parser) this.parser = parsers.json;
        if (Array.isArray(options.tools)) this.tools = options.tools as Tool[];
        if (this.think) this.extended = true;
        if (this.tools && this.tools.length > 0) this.extended = true;

        log.debug(`LLM ${this.service} constructor`);
    }

    get isLocal() { return (this.constructor as typeof LLM).isLocal }
    get apiKey() {
        if (this.options.apiKey) return this.options.apiKey;
        if (isBrowser()) {
            if (localStorage.getItem(`${this.service.toUpperCase()}_API_KEY`)) return localStorage.getItem(`${this.service.toUpperCase()}_API_KEY`);
        } else if (isNode()) {
            if (typeof process !== 'undefined' && process.env?.[`${this.service.toUpperCase()}_API_KEY`]) return process.env[`${this.service.toUpperCase()}_API_KEY`];
        }
        return undefined;
    }
    get llmOptions(): Options {
        const options = {
            model: this.model,
            messages: this.parseMessages(this.messages),
            stream: this.stream,
            max_tokens: this.max_tokens,
            think: this.think,
        } as Options;
        if (typeof this.max_thinking_tokens === "number") options.max_thinking_tokens = this.max_thinking_tokens;
        if (typeof this.temperature === "number") options.temperature = this.temperature;
        if (this.tools) options.tools = this.transformTools(this.tools);
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

    get chatUrl() { return join(this.baseUrl, "api/chat") }
    get modelsUrl() { return join(this.baseUrl, "api/tags") }
    getChatUrl(opts: Options) { return this.chatUrl }
    getModelsUrl() { return this.modelsUrl }
    get parsers(): Parsers {
        return {
            thinking: this.parseThinkingChunk.bind(this),
            content: this.parseContentChunk.bind(this),
            usage: this.parseTokenUsage.bind(this),
            tool_calls: this.parseToolsChunk.bind(this),
        }
    }

    addMessage(role: MessageRole, content: MessageContent) { this.messages.push({ role, content }) }
    user(content: string, attachments?: Attachment[]) {
        if (attachments && attachments.length > 0) {
            const key = (this.constructor as typeof LLM).MessageExtendedContentInputKey;
            this.addMessage("user", { type: key, text: content, attachments });
        } else {
            this.addMessage("user", content);
        }
    }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }
    thinking(content: string) { this.addMessage("thinking", content) }
    toolCall(tool: ToolCall) { this.addMessage("tool_call", tool) }
    toolResult(tool: ToolResult) { this.addMessage("tool_result", tool) }

    async chat(input: string, options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const attachments = options?.attachments || [];
        this.user(input, attachments);
        return await this.send(options);
    }

    async run(input: string, options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        const attachments = options?.attachments || [];
        this.user(input, attachments);

        let runSteps = options?.runSteps ?? this.runSteps;

        let response: Response;
        for (let i = 0; i < runSteps; i++) {
            let added = false;
            response = await this.send(options) as Response;

            for (const tool of response.tool_calls || []) {
                const result = await this.runTool(tool);
                this.toolResult(result);
                added = true;
            }

            if (!added) break;
        }


        if (!response) throw new Error("No response");

        return response;
    }

    async runTool(tool: ToolCall) : Promise<any> {
        const tools = this.tools || [] as ToolFunction[];
        for (const t of tools) {
            const toolFunction = t as ToolFunction;
            if (toolFunction.name === tool.name) {
                if (typeof t !== "function") throw new Error("Tool function is not a function");
                log(`Running tool ${toolFunction.name} with input ${JSON.stringify(tool.input)}`);
                return await toolFunction(tool.input);
            }
        }
        return true;
    }

    abort() { 
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    async send(options?: Options): Promise<string | AsyncGenerator<string> | Response | PartialStreamResponse> {
        delete options?.attachments;

        const vanillaOptions = { ...this.llmOptions, ...options || {} };
        const opts = this.parseOptions(JSON.parse(JSON.stringify(vanillaOptions)));

        this.resetCache();

        if (opts.tools && opts.tools.length > 0) this.extended = true;

        log.debug(`LLM ${this.service} send`);

        this.abortController = new AbortController();

        const response = await fetch(this.getChatUrl(opts), {
            method: "POST",
            body: JSON.stringify(opts),
            headers: this.llmHeaders,
            signal: this.abortController.signal,
            mode: "cors",
            credentials: "omit",
        });

        await handleErrorResponse(response, "Failed to send request");

        if (this.stream) {
            const body = response.body;
            if (!body) throw new Error("No body found");
            if (this.extended) return this.extendedStreamResponse(body, vanillaOptions);
            return this.streamResponse(body);
        }

        try {
            const data = await response.json();
            if (this.extended) return this.extendedResponse(data, vanillaOptions);
            return this.response(data);
        } finally {
            this.abortController = null;
        }
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
        const restream = this.streamResponses(stream, { content: this.parseContentChunk.bind(this) });
        for await (const chunk of restream) {
            if (chunk.type === "content") {
                yield chunk.content as string;
            }
        }

        this.abortController = null;
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

        this.saveBuffers(buffers);

        return buffers;
    }

    protected saveBuffers(buffers: Record<string, string | InputOutputTokens | ToolCall[] | StreamingToolCall>) {
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

            this.abortController = null;

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
        log.debug(`LLM ${this.service} fetchModels`);
        const response = await fetch(this.getModelsUrl(), options);
        await handleErrorResponse(response, "Failed to fetch models");

        const data = await response.json();
        let models = [];
        if (Array.isArray(data)) models = data;
        else if (Array.isArray(data.models)) models = data.models;
        else if (Array.isArray(data.data)) models = data.data;

        if (!models) throw new Error("No models found");
        return models.map(this.parseModel);
    }

    async verifyConnection(): Promise<boolean> { return (await this.fetchModels()).length > 0 }

    getDefaultModelUsage(model: Model): ModelUsageType {
        return {
            input_cost_per_token: 0,
            output_cost_per_token: 0,
            output_cost_per_reasoning_token: 0,
            mode: "chat",
            service: this.service,
            model: model.model,
            max_tokens: model.max_tokens || 0,
            max_input_tokens: model.max_input_tokens || 0,
            max_output_tokens: model.max_output_tokens || 0,
            supports_reasoning: model.supports_reasoning || false,
            supports_function_calling: model.supports_function_calling || false,
            supports_vision: model.supports_vision || false,
            supports_web_search: model.supports_web_search || false,
            supports_audio_input: model.supports_audio_input || false,
            supports_audio_output: model.supports_audio_output || false,
            supports_prompt_caching: model.supports_prompt_caching || false,
            tags: model.tags || [],
        }
    }

    async getModels(quality_filter: QualityFilter = {}): Promise<Model[]> {
        const models = await this.fetchModels();
        return models.map(model => {
            let usage = ModelUsage.get(this.service, model.model, quality_filter) || {} as ModelUsageType;

            if (Object.keys(usage).length === 0) {
                if (this.isLocal) {
                    if (typeof model["supports_reasoning"] === "undefined") {
                        if (quality_filter.allowUnknown) {
                            usage = { input_cost_per_token: 0, output_cost_per_token: 0, output_cost_per_reasoning_token: 0 } as ModelUsageType;
                        } else {
                            throw new Error(`model info not found for ${model.model}`);
                        }
                    } else {
                        usage = this.getDefaultModelUsage(model);
                    }
                } else {
                    usage = this.getDefaultModelUsage(model);
                    if (!quality_filter.allowUnknown) throw new Error(`model info not found for ${model.model}`);
                }
            }

            return { ...usage, name: model.name, model: model.model, created: model.created, service: this.service, raw: model } as Model;
        }).filter(this.filterQualityModel);
    }

    filterQualityModel(model: Model): boolean {
        return true;
    }

    async getQualityModels(): Promise<Model[]> {
        return this.getModels({ allowUnknown: true, allowSimilar: true, topModels: true });
    }

    async refreshModelUsage(): Promise<void> {
        await this.modelUsage.refresh();
    }

    parseContent(data: any): string { throw new Error("parseContent not implemented") }
    parseTools(data: any): ToolCall[] { return [] }
    transformTools(tools: any[]): Tool[] {
        return tools.map(tool => {
            if (typeof tool === "function") return wrapTool(tool);
            return tool;
        });
    }
    parseToolsChunk(chunk: any): ToolCall[] { return this.parseTools(chunk) }
    parseContentChunk(chunk: any): string { return this.parseContent(chunk) }
    parseThinking(data: any): string { return "" }
    parseThinkingChunk(chunk: any): string { return this.parseThinking(chunk) }
    parseModel(model: any): Model { throw new Error("parseModel not implemented") }
    parseMessages(messages: Message[]): Message[] {
        return messages.map(message => {
            const copy = deepClone(message);
            if (copy.role === "thinking") copy.role = "assistant";

            // TODO
            // if (message.role === "tool_result") {
            //     msgs.push({ "role": "tool", "content": JSON.stringify(message.content) });
            //     added = true;
            // } else if (message.role === "tool_call") {
            //     msgs.push({ "role": "tool", "content": JSON.stringify(message.content) });
            //     added = true;
            // }

            if (message.content && message.content.attachments) {
                copy.content = this.parseAttachmentsContent(message.content);
            } else if (message.content && message.content.text) {
                copy.content = message.content.text;
            } else if (typeof copy.content !== "string") {
                copy.content = JSON.stringify(copy.content);
            }

            return copy;
        });
    }

    parseAttachmentsContent(content: MessageContent): MessageContent[] {
        const key = (this.constructor as typeof LLM).MessageExtendedContentInputKey;
        const parts = content.attachments.map(this.parseAttachment);
        parts.push({ type: key, text: content.text });
        return parts;
    }

    parseAttachment(attachment: Attachment): MessageContent {
        return attachment.content;
    }

    parseOptions(options: Options): Options {
        if (!options) return {};
        return options;
    }
    parseTokenUsage(usage: any): InputOutputTokens | null { return usage }
    parseUsage(tokenUsage: InputOutputTokens): Usage {
        const modelUsage = this.modelUsage.getModel(this.model, this.qualityFilter);
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