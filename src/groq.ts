import type { ServiceName, Options } from "./LLM.types";
import APIv1, { APIv1Options } from "./APIv1";

export type GroqOptions = APIv1Options & {
    reasoning_effort?: "none" | "default";
    reasoning_format?: "parsed" | "raw" | "hidden";
}

export default class Groq extends APIv1 {
    static readonly service: ServiceName = "groq";
    static DEFAULT_BASE_URL: string = "https://api.groq.com/openai/v1/";
    static DEFAULT_MODEL: string = "deepseek-r1-distill-llama-70b";
    static isLocal: boolean = false;
    static KEY_REASONING_CONTENT: string = "reasoning";

    parseOptions(options: GroqOptions): GroqOptions {
        // groq is supposed to support reasoning_effort — but in practice the only two thinking models they support are qwen-qwq-32b and deepseek-r1-distill-llama-70b
        // and neither of those support it — it seems to be implied automatically with the model...but we do care about the reasoning_format
        if (options.think) {
            if (!options.reasoning_format) options.reasoning_format = "parsed";
            delete options.think;
        }

        delete options.max_tokens;

        return options;
    }

    parseTokenUsage(data: any): { input_tokens: any; output_tokens: any; } | null {
        if (!data || !data.x_groq || !data.x_groq.usage) return null;
        if (!data.x_groq.usage.prompt_tokens) return null;
        if (!data.x_groq.usage.completion_tokens) return null;

        return {
            input_tokens: data.x_groq.usage.prompt_tokens,
            output_tokens: data.x_groq.usage.completion_tokens,
        };
    }
}
