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

export default class LLM {
    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;

    static readonly DEFAULT_BASE_URL: string;

    readonly service: ServiceName;

    constructor(input?: string, options: Options = {}) {
        const LLM = this.constructor as typeof LLM;

        this.messages = [];
        if (input) this.user(input);
        this.options = options;
        this.service = options.service ?? config.service as ServiceName;
        this.model = options.model ?? LLM.DEFAULT_MODEL;
        this.baseUrl = options.baseUrl ?? LLM.DEFAULT_BASE_URL;
    }

    addMessage(role: MessageRole, content: string) { this.messages.push({ role, content }) }
    user(content: string) { this.addMessage("user", content) }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }

    async send(): Promise<string> { throw new Error("Not implemented") }

    static async create(input: string, options: Options = {}): Promise<string> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}