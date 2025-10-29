import LLM from "./LLM";
import type { Message, Model, Options, ServiceName, ToolCall, Tool, MessageContent } from "./LLM.types";
import Attachment from "./Attachment";
import { keywordFilter, join } from "./utils";

/**
 * @category Options
 */
export interface OpenAIOptions extends Options {
    input?: string | Message[];
    max_output_tokens?: number;
    reasoning?: { effort: "low" | "medium" | "high", summary: "auto" | "concise" | "detailed" };
}

/**
 * @category Tools
 */
export interface OpenAITool {
    name: string;
    parameters: any;
    strict: boolean;
    type: "function";
    description: string;
}

/**
 * @category LLMs
 */
export default class OpenAI extends LLM {
    static readonly service: ServiceName = "openai";
    static DEFAULT_BASE_URL: string = "https://api.openai.com/v1";
    static DEFAULT_MODEL: string = "gpt-4o-mini";
    static isBearerAuth: boolean = true;
    static MessageExtendedContentInputKey: string = "input_text";

    get chatUrl() { return join(this.baseUrl, "responses") }
    get modelsUrl() { return join(this.baseUrl, "models") }

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

    parseContent(data: any): string {
        if (!data || !data.output || !Array.isArray(data.output)) return "";
        if (data.object !== "response" || data.status !== "completed") return "";
        for (const output of data.output) {
            if (output.type !== "message" || output.role !== "assistant" || output.status !== "completed" || !output.content || !Array.isArray(output.content)) continue;
            for (const content of output.content) { 
                if (content.type !== "output_text" || !content.text) continue;
                return content.text;
            }
        }

        return "";
    }

    parseTokenUsage(data: any) {
        if (data.response && data.type === "response.completed") data = data.response;

        if (!data || !data.usage || !data.usage.input_tokens || !data.usage.output_tokens) return null;

        return {
            input_tokens: data.usage.input_tokens,
            output_tokens: data.usage.output_tokens,
        };
    }

    parseTools(data: any): ToolCall[] {
        if (!data || !data.output || !Array.isArray(data.output)) return [];
        if (data.object !== "response" || data.status !== "completed") return [];

        const tool_calls: ToolCall[] = [];
        for (const output of data.output) {
            if (output.type !== "function_call" || output.status !== "completed" || !output.call_id || !output.name || !output.arguments) continue;
            tool_calls.push({
                id: output.call_id,
                name: output.name,
                input: JSON.parse(output.arguments),
            });
        }

        return tool_calls;
    }

    parseToolsChunk(data: any): ToolCall[]  {
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
            const tool_call = { id: this.cache["tool_call"].id, name: this.cache["tool_call"].name, input } as ToolCall;

            delete this.cache["tool_call"];
            delete this.cache["tool_call_input"];

            return [tool_call];
        } catch (error) {
            return [];
        }
    }

    parseThinking(data: any): string {
        if (!data || !data.output || !Array.isArray(data.output)) return "";
        if (data.object !== "response" || data.status !== "completed") return "";
        for (const output of data.output) {
            if (output.type !== "reasoning" || !output.summary || !Array.isArray(output.summary)) continue;
            for (const part of output.summary) {
                if (part.type !== "summary_text" || !part.text) continue;
                return part.text;
            }
        }
        return "";
    }

    parseThinkingChunk(chunk: any): string {
        if (!chunk || chunk.type !== "response.reasoning_summary_text.delta" || !chunk.delta) return "";
        return chunk.delta;
    }

    parseContentChunk(chunk: any): string {
        if (!chunk || !chunk.delta || chunk.type !== "response.output_text.delta") return "";
        return chunk.delta;
    }

    parseModel(model: any): Model {
        return {
            name: model.model,
            model: model.id,
            created: new Date(model.created * 1000),
        } as Model;
    }

    parseAttachment(attachment: Attachment): MessageContent {
        const data = (attachment.isURL) ? attachment.data : `data:${attachment.contentType};base64,${attachment.data}`;

        if (attachment.isImage) {
            return { type: "input_image", image_url: data }
        } else if (attachment.isDocument) {
            return { type: "input_file", filename: crypto.randomUUID(), file_data: data }
        }

        throw new Error("Unsupported attachment type");
    }

    filterQualityModel(model: Model): boolean {
        const keywords = ["audio", "image", "davinci", "babbage", "dall-e", "tts", "whisper", "embedding", "vision", "moderation", "realtime",
                          "computer-use", "transcribe", "instruct", "codex"];
        return keywordFilter(model.model, keywords);
    }

}

function wrapTool(tool: Tool): OpenAITool {
    return {
        name: tool.name,
        parameters: Object.assign({}, tool.input_schema, { additionalProperties: false }),
        strict: true,
        type: "function",
        description: tool.description,
    } as OpenAITool;
}
