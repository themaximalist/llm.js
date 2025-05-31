import config from "./config";

export type ServiceName = "anthropic" | "ollama";

export interface Options {
    service?: ServiceName;
    model?: string;
    baseUrl?: string;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
    role: MessageRole;
    content: string;
}

export type Input = string | Message[];

export default class LLM {
    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;

    static readonly DEFAULT_BASE_URL: string;

    static readonly service: ServiceName;

    constructor(input?: Input, options: Options = {}) {
        const LLM = this.constructor as typeof LLM;

        this.messages = [];
        if (input && typeof input === "string") this.user(input);
        else if (input && Array.isArray(input)) this.messages = input;
        this.options = options;
        this.model = options.model ?? LLM.DEFAULT_MODEL;
        this.baseUrl = options.baseUrl ?? LLM.DEFAULT_BASE_URL;
    }

    get service() { return (this.constructor as typeof LLM).service }

    addMessage(role: MessageRole, content: string) { this.messages.push({ role, content }) }
    user(content: string) { this.addMessage("user", content) }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }

    async send(): Promise<string> { throw new Error("Not implemented") }

    static async create(input: Input, options: Options = {}): Promise<string> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}