export type LLMServiceName = "anthropic" | "ollama";

export interface LLMOptions {
    service?: LLMServiceName;
}

export default class LLM {
    readonly service: LLMServiceName;

    constructor(private input?: string, options: LLMOptions = {}) {
        console.log("LLM constructor called");
    }

    async send(): Promise<string> {
        return "blue";
    }

    static async create(input: string, options = {}): Promise<string> {
        const llm = new LLM(input);
        return await llm.send();
    }
}