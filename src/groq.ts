import type { ServiceName, Model } from "./LLM.types";
import APIv1, { APIv1Options } from "./APIv1";
import { keywordFilter } from "./utils";

export type GroqOptions = APIv1Options & {
    reasoning_effort?: "none" | "default";
    reasoning_format?: "parsed" | "raw" | "hidden";
}

export default class Groq extends APIv1 {
    static readonly service: ServiceName = "groq";
    static DEFAULT_BASE_URL: string = "https://api.groq.com/openai/v1/";
    static DEFAULT_MODEL: string = "deepseek-r1-distill-llama-70b";
    static KEY_REASONING_CONTENT: string = "reasoning";

    parseOptions(options: GroqOptions): GroqOptions {
        options = super.parseOptions(options) as GroqOptions;
        // groq reasoning support is strange...implied by model usually
        if (options.reasoning_effort === "high") {
            delete options.reasoning_effort;
            if (!options.reasoning_format) options.reasoning_format = "parsed";
        }
        return options;
    }

    // groq wraps usage in x_groq for streaming
    parseTokenUsage(data: any): { input_tokens: any; output_tokens: any; } | null {
        if (!data) return null;
        if (!data.usage && data.x_groq && data.x_groq.usage) data = data.x_groq;

        if (!data || !data.usage) return null;
        if (!data.usage.prompt_tokens) return null;
        if (!data.usage.completion_tokens) return null;

        return {
            input_tokens: data.usage.prompt_tokens,
            output_tokens: data.usage.completion_tokens,
        };
    }

    filterQualityModel(model: Model): boolean {
        return keywordFilter(model.model, ["whisper", "tts"]);
    }
}
