import { type ModelUsageType } from "./ModelUsage";

export type ServiceName = "anthropic" | "ollama";

export interface Options {
    service?: ServiceName;
    messages?: Message[];
    model?: string;
    baseUrl?: string;
    apiKey?: string;
    stream?: boolean;
    max_tokens?: number;
    extended?: boolean;
    think?: boolean;
}

export interface InputOutputTokens {
    input_tokens: number;
    output_tokens: number;
}

export interface Usage extends InputOutputTokens {
    total_tokens: number;
    local: boolean;
    input_cost: number;
    output_cost: number;
    total_cost: number;
}

export interface Response {
    service: ServiceName;
    content: string;
    options: Options;
    messages: Message[];
    thinking?: string;
    usage: Usage;
}

export interface PartialStreamResponse {
    service: ServiceName;
    think: boolean;
    options: Options;
    stream: AsyncGenerator<string> | AsyncGenerator<Record<string, string | InputOutputTokens>>;
    complete: () => Promise<StreamResponse>;
}

export interface StreamResponse extends Response {
    // think: boolean;
}

export type MessageRole = "user" | "assistant" | "system" | "thinking";

export interface Message {
    role: MessageRole;
    content: string;
}

export interface Parsers {
    [key: string]: (chunk: any) => string | InputOutputTokens | null;
}

export type Input = string | Message[];

export type Model = ModelUsageType & {
    name?: string;
    created?: Date;
    raw?: any;
}
