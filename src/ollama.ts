import LLM, { type ServiceName } from "./LLM";

export default class Ollama extends LLM {
    readonly service: ServiceName = "ollama";
    static readonly DEFAULT_BASE_URL: string = "http://localhost:11434";
    static readonly DEFAULT_MODEL: string = "gemma3:4b";

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
}
