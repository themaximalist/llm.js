import LLM, { type Model, type ServiceName } from "./LLM";

export default class Ollama extends LLM {
    static readonly service: ServiceName = "ollama";
    static readonly DEFAULT_BASE_URL: string = "http://localhost:11434";
    static readonly DEFAULT_MODEL: string = "gemma3:4b";
    static readonly isLocal: boolean = true;

    async send(): Promise<string> {
        const body = {
            model: this.model,
            messages: this.messages,
        }

        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        return response.text();
    }

    async fetchModels(): Promise<Model[]> {
        const response = await fetch(`${this.baseUrl}/api/tags`);
        const data = await response.json();
        if (!data.models) throw new Error("No models found");
        return data.models.map(model => {
            model.created = new Date(model.modified_at);
            return model;
        })
    }
}
