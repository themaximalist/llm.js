import LLM from "./LLM";
import type { Model, ServiceName, Options, ToolCall, StreamingToolCall } from "./LLM.types";

export interface AnthropicOptions extends Options {
    thinking: {
        type: "enabled" | "disabled";
        budget_tokens: number;
    }
}

export interface AnthropicThinking {
    role: "thinking",
    thinking: string;
}

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static DEFAULT_MODEL: string = "claude-opus-4-20250514";
    static API_VERSION: string = "2023-06-01";

    get chatUrl() { return `${this.baseUrl}/messages` }
    get modelsUrl() { return `${this.baseUrl}/models` }
    get llmHeaders() {
        return Object.assign({
            "anthropic-version": Anthropic.API_VERSION,
        }, super.llmHeaders);
    }

    protected parseOptions(options: AnthropicOptions): AnthropicOptions {
        if (options.think) {
            const budget_tokens = Math.floor((options.max_tokens || 0) / 2);
            options.thinking = {
                type: "enabled",
                budget_tokens,
            };
        }

        if (typeof options.max_thinking_tokens === "number") {
            options.thinking.budget_tokens = options.max_thinking_tokens;
            delete options.max_thinking_tokens;
        }

        delete options.think;
        return options as AnthropicOptions;
    }

    protected parseThinking(data: any): string {
        const messages = data.content ?? [];
        for (const message of messages) {
            if (message.type !== "thinking") continue;
            if (!message.thinking) continue;
            return message.thinking;
        }
        return "";
    }

    protected parseThinkingChunk(chunk: any): string {
        if (!chunk) return "";
        if (chunk.type !== "content_block_delta") return "";
        if (!chunk.delta) return "";
        if (chunk.delta.type !== "thinking_delta") return "";
        if (!chunk.delta.thinking) return "";
        return chunk.delta.thinking;
    }

    protected parseTokenUsage(data: any) {
        if (!data) return null;
        const input_tokens = data.message?.usage?.input_tokens || data.usage?.input_tokens;
        const output_tokens = data.message?.usage?.output_tokens || data.usage?.output_tokens;
        if (typeof input_tokens !== "number") return null;
        if (typeof output_tokens !== "number") return null;
        return {
            input_tokens,
            output_tokens,
        };
    }

    protected parseContent(data: any): string {
        const messages = data.content ?? [];
        for (const message of messages) {
            if (message.type !== "text") continue;
            if (!message.text) continue;
            return message.text;
        }
        return "";
    }

    protected parseChunkContent(chunk: any): string {
        if (chunk.type !== "content_block_delta") return "";
        if (!chunk.delta) return "";
        if (chunk.delta.type !== "text_delta") return "";
        if (!chunk.delta.text) return "";
        return chunk.delta.text;
    }

    protected parseToolsChunk(data: any): ToolCall[]  {
        return [];
    }

    protected parseTools(data: any): ToolCall[] {
        const tools: ToolCall[] = [];

        if (!data) return [];
        if (!data.content) return [];
        if (!Array.isArray(data.content)) return [];
        for (const content of data.content) {
            if (content.type !== "tool_use") continue;
            if (!content.id) continue;
            if (!content.name) continue;
            if (!content.input) continue;

            tools.push({
                id: content.id,
                name: content.name,
                input: content.input,
            });
        }

        return tools;
    }

    protected parseModel(model: any): Model {
        return {
            name: model.display_name,
            model: model.id,
            created: new Date(model.created_at),
        } as Model;
    }


}