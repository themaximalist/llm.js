import LLM from "./LLM";
import type { Model, ServiceName, Options, ToolCall } from "./LLM.types";
import { isBrowser, join } from "./utils";

/**
 * @category Options
 */
export interface AnthropicOptions extends Options {
    thinking: {
        type: "enabled" | "disabled";
        budget_tokens: number;
    }
}

/**
 * @category LLMs
 */
export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static DEFAULT_MODEL: string = "claude-opus-4-20250514";
    static API_VERSION: string = "2023-06-01";

    get chatUrl() { return join(this.baseUrl, "messages") }
    get modelsUrl() { return join(this.baseUrl, "models") }
    get llmHeaders() {
        const headers = Object.assign({
            "anthropic-version": Anthropic.API_VERSION,
        }, super.llmHeaders);

        if (isBrowser()) {
            headers["anthropic-dangerous-direct-browser-access"] = "true";
        }

        return headers;
    }

    parseOptions(options: AnthropicOptions): AnthropicOptions {
        if (options.think) {
            const budget_tokens = Math.floor((options.max_tokens || 0) / 2);
            options.thinking = { type: "enabled", budget_tokens };
        }

        if (typeof options.max_thinking_tokens === "number") {
            options.thinking.budget_tokens = options.max_thinking_tokens;
            delete options.max_thinking_tokens;
        }

        delete options.think;
        return options as AnthropicOptions;
    }

    parseThinking(data: any): string {
        const messages = data.content ?? [];
        for (const message of messages) {
            if (message.type !== "thinking") continue;
            if (!message.thinking) continue;
            return message.thinking;
        }
        return "";
    }

    parseThinkingChunk(chunk: any): string {
        if (!chunk || chunk.type !== "content_block_delta" || !chunk.delta) return "";
        const delta = chunk.delta;
        if (delta.type !== "thinking_delta" || !delta.thinking) return "";
        return delta.thinking;
    }

    parseTokenUsage(data: any) {
        if (!data) return null;
        const input_tokens = data.message?.usage?.input_tokens || data.usage?.input_tokens;
        const output_tokens = data.message?.usage?.output_tokens || data.usage?.output_tokens;
        if (typeof input_tokens !== "number") return null;
        if (typeof output_tokens !== "number") return null;
        return { input_tokens, output_tokens };
    }

    parseContent(data: any): string {
        const messages = data.content ?? [];
        for (const message of messages) {
            if (message.type !== "text" || !message.text) continue;
            return message.text;
        }
        return "";
    }

    parseContentChunk(chunk: any): string {
        if (chunk.type !== "content_block_delta" || !chunk.delta || chunk.delta.type !== "text_delta" || !chunk.delta.text) return "";
        return chunk.delta.text;
    }

    parseToolsChunk(data: any): ToolCall[]  {
        if (data.type === "content_block_start" && data.content_block && data.content_block.type === "tool_use") {
            this.cache["tool_call"] = data.content_block;
        }

        if (this.cache["tool_call"] && data.type === "content_block_delta" && data.delta && data.delta.type === "input_json_delta") {
            if (!this.cache["tool_call_input"]) this.cache["tool_call_input"] = "";
            this.cache["tool_call_input"] += data.delta.partial_json;
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

    parseTools(data: any): ToolCall[] {
        if (!data || !data.content || !Array.isArray(data.content)) return [];
        const tools: ToolCall[] = [];
        for (const content of data.content) {
            if (content.type !== "tool_use" || !content.id || !content.name || !content.input) continue;
            tools.push({ id: content.id, name: content.name, input: content.input });
        }
        return tools;
    }

    parseModel(model: any): Model {
        return { name: model.display_name, model: model.id, created: new Date(model.created_at) } as Model;
    }

    filterQualityModel(model: Model): boolean {
        if (model.mode !== "chat") return false;
        if (model.model.startsWith("claude-2")) return false;
        return true;
    }
}