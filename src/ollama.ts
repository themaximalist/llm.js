import LLM, { type Model, type ServiceName } from "./LLM";

export default class Ollama extends LLM {
    static readonly service: ServiceName = "ollama";
    static readonly DEFAULT_BASE_URL: string = "http://localhost:11434";
    static readonly DEFAULT_MODEL: string = "gemma3:4b";
    static readonly isLocal: boolean = true;

    get chatUrl() { return `${this.baseUrl}/api/chat` }

    async send(): Promise<string> {
        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(this.llmOptions),
        });

        const data = await response.json();
        if (!data.message) throw new Error("No message found");

        return data.message.content;
    }

    async fetchModels(): Promise<Model[]> {
        const response = await fetch(this.modelsUrl);
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
