import LLM from "./LLM";
import type { Options, Model, ServiceName } from "./LLM";

interface OllamaOptions extends Options {
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

        return options;
    }

    parseThinking(data: any): string | null {
        if (!data) return null;
        if (!data.message) return null;
        if (!data.message.thinking) return null;
        return data.message.thinking;
    }

    parseTokenUsage(usage: any) {
        return {
            input_tokens: usage.prompt_eval_count,
            output_tokens: usage.eval_count,
        };
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
