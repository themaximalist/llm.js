import LLM from "./LLM";
import type { Options, Model, ServiceName, ToolCall, Tool, WrappedToolCall, MessageContent, Message } from "./LLM.types";
import { unwrapToolCall, wrapTool, join } from "./utils";
import Attachment from "./Attachment";

/**
 * @category Message
 */
export interface OllamaMessage {
    role: string;
    content?: string;
    images?: string[];
}

/**
 * @category Options
 */
export interface OllamaOptions extends Options {
    think?: boolean;
    options?: {
        num_predict?: number;
    }
}

/**
 * @category LLMs
 */
export default class Ollama extends LLM {
    static readonly service: ServiceName = "ollama";
    static DEFAULT_BASE_URL: string = "http://localhost:11434";
    static DEFAULT_MODEL: string = "gemma3:4b";
    static isLocal: boolean = true;

    get chatUrl() { return join(this.baseUrl, "api/chat") }
    get modelsUrl() { return join(this.baseUrl, "api/tags") }
    get modelUrl() { return join(this.baseUrl, "api/show") }

    get llmHeaders() {
        const headers = super.llmHeaders;
        delete headers["x-api-key"];
        return headers;
    }

    parseOptions(options: OllamaOptions): OllamaOptions {
        if (options.max_tokens) {
            const max_tokens = options.max_tokens;
            delete options.max_tokens;
            if (!options.options) options.options = {};
            options.options.num_predict = max_tokens;
        }

        if (options.tools) {
            const tools = options.tools.map(tool => wrapTool(tool as Tool));
            options.tools = tools;
        }

        delete options.apiKey;

        return options;
    }

    parseThinking(data: any): string {
        if (!data || !data.message || !data.message.thinking) return "";
        return data.message.thinking;
    }

    parseTokenUsage(usage: any) {
        if (!usage) return null;
        if (typeof usage.prompt_eval_count !== "number") return null;
        if (typeof usage.eval_count !== "number") return null;

        return { input_tokens: usage.prompt_eval_count, output_tokens: usage.eval_count };
    }

    parseContent(data: any): string {
        if (!data || !data.message || !data.message.content) return "";
        return data.message.content;
    }

    parseContentChunk(chunk: any): string {
        if (!chunk || !chunk.message || !chunk.message.content || chunk.message.role !== "assistant") return "";
        return chunk.message.content;
    }

    parseTools(data: any): ToolCall[] {
        if (!data || !data.message || !data.message.tool_calls) return [];
        return data.message.tool_calls.map((tool_call: WrappedToolCall) => unwrapToolCall(tool_call));
    }

    parseModel(model: any): Model {
        return { name: model.model, model: model.model, created: new Date(model.modified_at) } as Model;
    }

    async fetchModel(model: string): Promise<any> {
        const response = await fetch(`${this.modelUrl}`, {
            method: "POST",
            body: JSON.stringify({ name: model }),
        });
        return await response.json();
    }

    async fetchModels(): Promise<Model[]> {
        const models = await super.fetchModels();
        for (const model of models) {
            const modelData = await this.fetchModel(model.model);
            const modelInfo = modelData.model_info;
            const architecture = modelInfo["general.architecture"];
            const context_length = modelInfo[`${architecture}.context_length`];
            const capabilities = modelData.capabilities ?? [];
            model.supports_reasoning = capabilities.includes("thinking");
            model.supports_function_calling = capabilities.includes("tools");
            model.supports_vision = capabilities.includes("vision");
            model.supports_web_search = false;
            model.supports_audio_input = false;
            model.supports_audio_output = false;
            model.supports_prompt_caching = false;
            model.max_tokens = context_length;
            model.tags = [];
            if (model.supports_reasoning) model.tags.push("reasoning");
            if (model.supports_function_calling) model.tags.push("tools");
            if (model.supports_vision) model.tags.push("images");
        }

        return models;
    }

    async verifyConnection(): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}`);
        return await response.text() === "Ollama is running";
    }

    parseMessages(messages: Message[]): Message[] {
        const msgs = [] as OllamaMessage[];
        for (const message of messages) {
            let added = false;

            if (message.role === "thinking" || message.role === "tool_call") message.role = "assistant";

            if (message.role && message.content.text) {
                msgs.push({ "role": message.role, "content": message.content.text });
                added = true;
            }

            if (message.role && message.content.attachments) {
                msgs.push({ "role": message.role, "images": message.content.attachments.map(this.parseAttachment) });
                added = true;
            }

            if (!added) {
                msgs.push(message);
            }
        }

        return msgs as Message[];
    }

    parseAttachmentsContent(content: MessageContent): MessageContent[] {
        return [{
            "role": "user",
            "content": content.text,
            "images": content.attachments.map(this.parseAttachment)
        }]
    }

    parseAttachment(attachment: Attachment): MessageContent {
        if (attachment.isImage && !attachment.isURL) {
            return attachment.data;
        }

        throw new Error("Unsupported attachment type");
    }
}
