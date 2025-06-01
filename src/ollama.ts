import LLM from "./LLM";
import type { Options, Model, ServiceName } from "./LLM";
import { handleErrorResponse, parseStream } from "./utils";

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
    get llmOptions() : OllamaOptions {
        const options = super.llmOptions as OllamaOptions;
        options.options = { num_predict: this.max_tokens }
        delete options.max_tokens;
        return options;
    }

    async send(): Promise<string | AsyncGenerator<string>> {
        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(this.llmOptions),
        });

        await handleErrorResponse(response);

        if (this.stream) {
            const body = response.body;
            if (!body) throw new Error("No body found");
            return this.streamResponse(body);
        }

        const data = await response.json();
        if (!data.message) throw new Error("No message found");

        const content = data.message.content;
        this.assistant(content);

        return content;
    }

    chunkContent(chunk: any): string {
        if (!chunk.message) return "";
        if (chunk.message.role !== "assistant") return "";
        if (!chunk.message.content) return "";
        return chunk.message.content;
    }

    async fetchModels(): Promise<Model[]> {
        const response = await fetch(this.modelsUrl);
        await handleErrorResponse(response);

        const data = await response.json();
        if (!data.models) throw new Error("No models found");
        return data.models.map(model => {
            model.created = new Date(model.modified_at);
            return model;
        })
    }

    async verifyConnection(): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}`);
        return await response.text() === "Ollama is running";
    }
}
