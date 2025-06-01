import LLM, { type Model, type ServiceName } from "./LLM";
import { handleErrorResponse } from "./utils";

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static readonly DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static readonly DEFAULT_MODEL: string = "claude-opus-4-20250514";
    static readonly API_VERSION: string = "2023-06-01";

    get chatUrl() { return `${this.baseUrl}/messages` }
    get modelsUrl() { return `${this.baseUrl}/models` }
    get llmHeaders() {
        return Object.assign({
            "anthropic-version": Anthropic.API_VERSION,
        }, super.llmHeaders);
    }

    async send(): Promise<string> {
        const response = await fetch(this.chatUrl, {
            method: "POST",
            body: JSON.stringify(this.llmOptions),
            headers: this.llmHeaders,
        } as RequestInit);

        await handleErrorResponse(response);

        const data = await response.json();
        if (!data.content) throw new Error("No message found");
        if (data.content[0].type !== "text") throw new Error("No text message found");
        if (!data.content[0].text) throw new Error("No text found");
        return data.content[0].text;
    }

    async fetchModels(): Promise<Model[]> {
        const options = { headers: this.llmHeaders } as RequestInit;

        const response = await fetch(this.modelsUrl, options);
        await handleErrorResponse(response);

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