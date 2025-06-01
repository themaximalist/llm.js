import LLM from "./LLM";
import type { Options, Model, ServiceName } from "./LLM";

interface OllamaOptions extends Options {
    options?: {
        num_predict?: number;
    }
}

export default class Ollama extends LLM {
    static readonly service: ServiceName = "ollama";
    static readonly DEFAULT_BASE_URL: string = "http://localhost:11434";
    static readonly DEFAULT_MODEL: string = "gemma3:4b";
    static readonly isLocal: boolean = true;

    get chatUrl() { return `${this.baseUrl}/api/chat` }
    get modelsUrl() { return `${this.baseUrl}/api/tags` }

    get llmOptions() : OllamaOptions {
        const options = super.llmOptions as OllamaOptions;
        options.options = { num_predict: this.max_tokens }
        delete options.max_tokens;
        return options;
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
