import LLM, { type Model, type ServiceName } from "./LLM";

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static readonly DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static readonly DEFAULT_MODEL: string = "claude-opus-4-20250514";

    async fetchModels(): Promise<Model[]> {
        const response = await fetch(`${this.baseUrl}/models`);
        console.log(response);
        const data = await response.json();
        return data.models.map(model => {
            return model;
        });
    }

    async verifyConnection(): Promise<boolean> {
        const response = await fetch(`${this.baseUrl}/models`);
        console.log(response);
        const data = await response.json();
        console.log(data);
        return data.models.length > 0;
    }
}