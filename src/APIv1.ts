import LLM from "./LLM";
import type { ServiceName, Options, Model } from "./LLM.types";

export type APIv1Options = Options & {
    stream_options?: {
        include_usage?: boolean;
    },
    reasoning_effort?: "low" | "medium" | "high"
}

/** OpenAI API v1 Compatible Base CLass */
export default class APIv1 extends LLM {
    static readonly service: ServiceName = "openai";
    static DEFAULT_BASE_URL: string = "";
    static DEFAULT_MODEL: string = "";
    static isLocal: boolean = false;
    static isBearerAuth: boolean = true;

    get chatUrl() { return `${this.baseUrl}chat/completions` }
    get modelsUrl() { return `${this.baseUrl}models` }

    parseOptions(options: APIv1Options): APIv1Options {
        // if (options.think && !options.reasoning_effort) {
        //     options.reasoning_effort = "medium";
        //     options.generationConfig = {
        //         thinkingConfig: {
        //             includeThoughts: true
        //         }
        //     }
        // }

        delete options.think;
        if (options.stream) {
            options.stream_options = { include_usage: true };
        }
        return options;
    }

    parseContent(data: any): string {
        if (!data) return "";
        if (!data.choices) return "";
        if (!data.choices[0]) return "";
        if (!data.choices[0].message) return "";
        return data.choices[0].message.content;
    }

    parseContentChunk(data: any): string {
        if (!data) return "";
        if (!data.choices) return "";
        if (!data.choices[0]) return "";
        if (!data.choices[0].delta) return "";
        if (!data.choices[0].delta.content) return "";
        if (data.choices[0].delta.role !== "assistant") return "";
        return data.choices[0].delta.content;
    }

    parseThinking(data: any): string {
        return "";
        // if (!data) return "";
        // if (!data.choices) return "";
        // if (!data.choices[0]) return "";
        // if (!data.choices[0].message) return "";
        // return data.choices[0].message.content;
    }

    parseTokenUsage(data: any) {
        if (!data) return null;
        if (!data.usage) return null;
        if (!data.usage.prompt_tokens) return null;
        if (!data.usage.completion_tokens) return null;

        return {
            input_tokens: data.usage.prompt_tokens,
            output_tokens: data.usage.completion_tokens,
        };
    }

    parseModel(model: any): Model {
        return {
            name: model.model,
            model: model.id,
            created: new Date(model.created * 1000),
        } as Model;
    }
}