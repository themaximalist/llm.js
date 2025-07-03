import LLM from "./LLM";
import Attachment from "./Attachment";
import type { ServiceName, Options, Model, ToolCall, Tool, MessageContent, Message, MessageRole } from "./LLM.types";
import { filterMessageRole, filterNotMessageRole, keywordFilter, uuid, join, deepClone } from "./utils";
import APIv1, { APIv1Options } from "./APIv1";

/**
 * @category Message
 */
export interface GoogleMessage {
    role: "user" | "model";
    parts: Array<{ text?: string } | { inline_data?: { mime_type: string; data: string } }>;
}

/**
 * @category Tools
 */
export interface GoogleTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

/**
 * @category Options
 */
export interface GoogleOptions extends APIv1Options { }

/**
 * @category LLMs
 */
export default class Google extends APIv1 {
    static readonly service: ServiceName = "google";
    static DEFAULT_BASE_URL: string = "https://generativelanguage.googleapis.com/v1beta/openai";
    static DEFAULT_MODEL: string = "gemini-2.5-flash";
    static KEY_REASONING_CONTENT: string = "reasoning";

    parseOptions(options: GoogleOptions): GoogleOptions {
        options = super.parseOptions(options) as GoogleOptions;

        return options;
    }

    parseTokenUsage(data: any) {
        if (data.response && data.type === "response.completed") data = data.response;

        if (!data || !data.usage || !data.usage.input_tokens || !data.usage.output_tokens) return null;

        return {
            input_tokens: data.usage.input_tokens,
            output_tokens: data.usage.output_tokens,
        };
    }

    filterQualityModel(model: Model): boolean {
        const keywords = ["embedding", "vision", "learnlm", "image-generation", "gemma-3", "gemma-3n", "gemini-1.5", "embedding"];
        return keywordFilter(model.model, keywords);
    }
}
