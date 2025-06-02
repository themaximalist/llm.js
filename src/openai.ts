import LLM from "./LLM";
import type { Message, Model, Options, ServiceName, ToolCall, Tool } from "./LLM.types";

export interface OpenAIOptions extends Options {
    input?: string | Message[];
    max_output_tokens?: number;
    reasoning?: { effort: "low" | "medium" | "high", summary: "auto" | "concise" | "detailed" };
}

export interface OpenAITool {
    name: string;
    parameters: any;
    strict: boolean;
    type: "function";
    description: string;
}

export default class OpenAI extends LLM {
    static readonly service: ServiceName = "openai";
    static DEFAULT_BASE_URL: string = "https://api.openai.com/v1";
    static DEFAULT_MODEL: string = "gpt-4o-mini";
    static isLocal: boolean = false;
    static isBearerAuth: boolean = true;

    get chatUrl() { return `${this.baseUrl}/responses` }
    get modelsUrl() { return `${this.baseUrl}/models` }

    parseOptions(options: OpenAIOptions): OpenAIOptions {
        options.input = options.messages;
        delete options.messages;

        if (options.max_tokens) {
            const max_tokens = options.max_tokens;
            delete options.max_tokens;
            options.max_output_tokens = max_tokens;
        }

        if (options.tools) {
            const tools = options.tools.map(tool => wrapTool(tool as Tool));
            options.tools = tools;
        }

        if (options.think && !options.reasoning) {
            options.reasoning = { effort: "medium", summary: "detailed" };
        }
        delete options.think;

        return options;
    }

    protected parseContent(data: any): string {
        if (!data) return "";
        if (data.object !== "response") return "";
        if (data.status !== "completed") return "";
        if (!data.output) return "";
        if (!Array.isArray(data.output)) return "";
        for (const output of data.output) {
            if (output.type !== "message") continue;
            if (output.role !== "assistant") continue;
            if (output.status !== "completed") continue;
            if (!output.content) continue;
            if (!Array.isArray(output.content)) continue;
            for (const content of output.content) { 
                if (content.type !== "output_text") continue;
                if (!content.text) continue;
                return content.text;
            }
        }

        return "";
    }

    parseTokenUsage(data: any) {
        if (data.response && data.type === "response.completed") data = data.response;

        if (!data) return null;
        if (!data.usage) return null;
        if (!data.usage.input_tokens) return null;
        if (!data.usage.output_tokens) return null;

        return {
            input_tokens: data.usage.input_tokens,
            output_tokens: data.usage.output_tokens,
        };
    }

    parseTools(data: any): ToolCall[] {
        if (!data) return [];
        if (data.object !== "response") return [];
        if (data.status !== "completed") return [];
        if (!data.output) return [];
        if (!Array.isArray(data.output)) return [];

        const tool_calls: ToolCall[] = [];
        for (const output of data.output) {
            if (output.type !== "function_call") continue;
            if (output.status !== "completed") continue;
            if (!output.call_id) continue;
            if (!output.name) continue;
            if (!output.arguments) continue;
            tool_calls.push({
                id: output.call_id,
                name: output.name,
                input: JSON.parse(output.arguments),
            });
        }

        return tool_calls;
    }

    protected parseToolsChunk(data: any): ToolCall[]  {
        if (data.type === "response.output_item.added" && data.item && data.item.type === "function_call") {
            this.cache["tool_call"] = data.item;
        }

        if (this.cache["tool_call"] && data.type === "response.function_call_arguments.done") {
            this.cache["tool_call_input"] = data.arguments;
        }

        if (!this.cache["tool_call"]) return [];
        if (!this.cache["tool_call_input"]) return [];

        try {
            const input = JSON.parse(this.cache["tool_call_input"]);
            const tool_call = {
                id: this.cache["tool_call"].id,
                name: this.cache["tool_call"].name,
                input,
            } as ToolCall;

            delete this.cache["tool_call"];
            delete this.cache["tool_call_input"];

            return [tool_call];
        } catch (error) {
            return [];
        }
    }

    parseThinking(data: any): string {
        if (!data) return "";
        if (data.object !== "response") return "";
        if (data.status !== "completed") return "";
        if (!data.output) return "";
        if (!Array.isArray(data.output)) return "";
        for (const output of data.output) {
            if (output.type !== "message") continue;
            if (output.role !== "assistant") continue;
            if (output.status !== "completed") continue;
            if (!output.content) continue;
            if (!Array.isArray(output.content)) continue;
            for (const content of output.content) {
                if (content.type !== "output_text") continue;
                if (!content.text) continue;
                return content.text;
            }
        }
        return "";
    }

    parseThinkingChunk(chunk: any): string {
        if (!chunk) return "";
        if (chunk.type !== "response.reasoning_summary_text.delta") return "";
        if (!chunk.delta) return "";
        return chunk.delta;
    }

    parseContentChunk(chunk: any): string {
        if (!chunk) return "";
        if (!chunk.delta) return "";
        return chunk.delta;
    }

    protected parseModel(model: any): Model {
        return {
            name: model.model,
            model: model.id,
            created: new Date(model.created * 1000),
        } as Model;
    }

}

/*
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




}

*/

function wrapTool(tool: Tool): OpenAITool {
    return {
        name: tool.name,
        parameters: Object.assign({}, tool.input_schema, { additionalProperties: false }),
        strict: true,
        type: "function",
        description: tool.description,
    } as OpenAITool;
}
