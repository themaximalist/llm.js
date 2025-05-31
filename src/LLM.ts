export interface LLMOptions {
    service?: string;
}

export default class LLM {
    readonly service: string;

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