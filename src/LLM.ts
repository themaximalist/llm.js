import ModelUsage from "./ModelUsage.ts";
import type { ModelUsageType } from "./ModelUsage.ts";

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

export type Model = ModelUsageType & {
    name?: string;
    created?: Date;
    raw?: any;
}

export default class LLM {
    static readonly service: ServiceName;
    static readonly DEFAULT_BASE_URL: string;
    static readonly isLocal: boolean = false;

    messages: Message[];
    model?: string;
    baseUrl?: string;
    options: Options;
    modelUsage: ModelUsageType[];

    constructor(input?: Input, options: Options = {}) {
        const LLM = this.constructor as typeof LLM;

        this.messages = [];
        if (input && typeof input === "string") this.user(input);
        else if (input && Array.isArray(input)) this.messages = input;
        this.options = options;
        this.model = options.model ?? LLM.DEFAULT_MODEL;
        this.baseUrl = options.baseUrl ?? LLM.DEFAULT_BASE_URL;
        this.modelUsage = ModelUsage.get();
    }

    get service() { return (this.constructor as typeof LLM).service }
    get isLocal() { return (this.constructor as typeof LLM).isLocal }

    addMessage(role: MessageRole, content: string) { this.messages.push({ role, content }) }
    user(content: string) { this.addMessage("user", content) }
    assistant(content: string) { this.addMessage("assistant", content) }
    system(content: string) { this.addMessage("system", content) }

    async send(): Promise<string> { throw new Error("Not implemented") }
    async fetchModels(): Promise<Model[]> { throw new Error("Not implemented") }
    async getModels(): Promise<Model[]> {
        const models = await this.fetchModels();
        return models.map(model => {
            const usage = this.modelUsage.find(usage => usage.model === model.model) || {} as ModelUsageType;

            if (this.isLocal) {
                usage.input_cost_per_token = 0;
                usage.output_cost_per_token = 0;
                usage.output_cost_per_reasoning_token = 0;
            }

            return {
                ...usage,
                name: model.name,
                model: model.model,
                created: model.created,
                service: this.service,
                raw: model,
            } as Model;
        });
    }
    async refreshModelUsage(): Promise<void> { this.modelUsage = await ModelUsage.refresh() }

    static async create(input: Input, options: Options = {}): Promise<string> {
        const llm = new LLM(input, options);
        return await llm.send();
    }
}