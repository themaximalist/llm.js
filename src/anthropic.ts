import LLM, { type Model, type ServiceName } from "./LLM";

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static readonly DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static readonly DEFAULT_MODEL: string = "claude-opus-4-20250514";
    static readonly API_VERSION: string = "2023-06-01";

    get modelsUrl() { return `${this.baseUrl}/models` }

    async fetchModels(): Promise<Model[]> {
        const options = {
            headers: {
                "x-api-key": this.apiKey,
                "anthropic-version": Anthropic.API_VERSION,
            }
        } as RequestInit;

        const response = await fetch(this.modelsUrl, options);
        if (!response.ok) {
            const data = await response.json();
            if (!data) throw new Error("Failed to fetch models");
            throw new Error(data.error.message);
        }
        const data = await response.json();
        return data.data.map(model => {
            return {
                name: model.display_name,
                model: model.id,
                created: new Date(model.created_at),
            }
        });
    }
}