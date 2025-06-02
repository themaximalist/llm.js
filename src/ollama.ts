import LLM from "./LLM";
import type { Options, Model, ServiceName, ToolCall, Tool, WrappedTool, WrappedToolCall } from "./LLM.types";

export interface OllamaOptions extends Options {
    think?: boolean;
    options?: {
        num_predict?: number;
    }
}

export default class Ollama extends LLM {
    static readonly service: ServiceName = "ollama";
    static DEFAULT_BASE_URL: string = "http://localhost:11434";
    static DEFAULT_MODEL: string = "gemma3:4b";
    static isLocal: boolean = true;

    get chatUrl() { return `${this.baseUrl}/api/chat` }
    get modelsUrl() { return `${this.baseUrl}/api/tags` }

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

    async verifyConnection(): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}`);
        return await response.text() === "Ollama is running";
    }
}

export function wrapTool(tool: Tool) : WrappedTool {
    if (!tool.name) throw new Error("Tool name is required");
    if (!tool.description) throw new Error("Tool description is required");
    if (!tool.input_schema) throw new Error("Tool input schema is required");

    return {
        type: "function",
        function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
    };
}

export function unwrapToolCall(tool_call: WrappedToolCall) : ToolCall {
    if (!tool_call.function) throw new Error("Tool call function is required");
    if (!tool_call.function.id) tool_call.function.id = crypto.randomUUID();
    if (!tool_call.function.name) throw new Error("Tool call function name is required");
    if (!tool_call.function.arguments) throw new Error("Tool call function arguments is required");

    return { id: tool_call.function.id, name: tool_call.function.name, input: tool_call.function.arguments };
}