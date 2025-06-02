import LLM from "./LLM";
import type { ServiceName, Options, Message, InputOutputTokens } from "./LLM.types";
import { filterMessageRole, filterNotMessageRole } from "./utils";

export interface GoogleMessage {
    role: "user" | "model" | "assistant";
    content: string;
}

export interface GoogleOptions extends Options {
    system_instruction?: {
        parts: { text: string }[];
    }
    contents?: {
        parts: { text: string }[];
    }[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
    }
}

export default class Google extends LLM {
    static readonly service: ServiceName = "google";
    static DEFAULT_BASE_URL: string = "https://generativelanguage.googleapis.com/v1beta/";
    static DEFAULT_MODEL: string = "gemini-2.0-flash";
    static isLocal: boolean = false;

    get chatUrl() { return `${this.baseUrl}/chat/completions` }
    get modelsUrl() { return `${this.baseUrl}openai/models` }

    getChatUrl(opts: Options) {
        return `${this.baseUrl}models/${opts.model}:generateContent?key=${this.apiKey}`;
    }

    parseOptions(options: GoogleOptions): GoogleOptions {
        const messages = JSON.parse(JSON.stringify(options.messages || [])).map((m: GoogleMessage) => {
            if (m.role === "assistant") m.role = "model";
            return m;
        });

        const system = filterMessageRole(messages, "system");
        const nonSystem = filterNotMessageRole(messages, "system");
        delete options.messages;

        if (system.length > 0) { options.system_instruction = { parts: system.map(message => ({ text: message.content })) } }
        if (nonSystem.length > 0) { options.contents = nonSystem.map(message => ({ role: message.role, parts: [{ text: message.content }] })) }

        if (!options.generationConfig) options.generationConfig = {};
        if (typeof options.temperature === "number") options.generationConfig.temperature = options.temperature;
        if (typeof options.max_tokens === "number") options.generationConfig.maxOutputTokens = options.max_tokens;
        if (!options.generationConfig.maxOutputTokens) options.generationConfig.maxOutputTokens = this.max_tokens;

        delete options.think;
        delete options.max_tokens;
        delete options.temperature;
        delete options.stream;

        return options;
    }
     
    parseContent(data: any): string {
        if (!data) return "";
        if (!data.candidates) return "";
        if (!data.candidates[0]) return "";
        if (!data.candidates[0].content) return "";
        if (data.candidates[0].content.role !== "model") return "";
        if (!data.candidates[0].content.parts) return "";
        if (!data.candidates[0].content.parts[0]) return "";
        if (!data.candidates[0].content.parts[0].text) return "";
        return data.candidates[0].content.parts[0].text;
    }

    parseTokenUsage(data: any) {
        if (!data) return null;
        if (!data.usageMetadata) return null;
        if (!data.usageMetadata.promptTokenCount) return null;
        if (!data.usageMetadata.candidatesTokenCount) return null;

        return {
            input_tokens: data.usageMetadata.promptTokenCount,
            output_tokens: data.usageMetadata.candidatesTokenCount,
        };
    }
}

/*
import type { Options, Model, ServiceName, ToolCall, Tool, WrappedTool, WrappedToolCall } from "./LLM.types";

export interface OllamaOptions extends Options {
    think?: boolean;
    options?: {
        num_predict?: number;
    }
}

export default class Ollama extends LLM {
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
        if (!data) return "";
        if (!data.message) return "";
        if (!data.message.thinking) return "";
        return data.message.thinking;
    }



    parseContent(data: any): string {
        if (!data.message) return "";
        if (!data.message.content) return "";
        return data.message.content;
    }

    parseChunkContent(chunk: any): string {
        if (!chunk.message) return "";
        if (chunk.message.role !== "assistant") return "";
        if (!chunk.message.content) return "";
        return chunk.message.content;
    }

    parseTools(data: any): ToolCall[] {
        if (!data.message) return [];
        if (!data.message.tool_calls) return [];
        return data.message.tool_calls.map((tool_call: WrappedToolCall) => unwrapToolCall(tool_call));
    }

    parseModel(model: any): Model {
        return {
            name: model.model,
            model: model.model,
            created: new Date(model.modified_at),
        } as Model;
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
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
        },
    };
}

export function unwrapToolCall(tool_call: WrappedToolCall) : ToolCall {
    if (!tool_call.function) throw new Error("Tool call function is required");
    if (!tool_call.function.id) tool_call.function.id = crypto.randomUUID();
    if (!tool_call.function.name) throw new Error("Tool call function name is required");
    if (!tool_call.function.arguments) throw new Error("Tool call function arguments is required");

    return {
        id: tool_call.function.id,
        name: tool_call.function.name,
        input: tool_call.function.arguments,
    };
}
    */