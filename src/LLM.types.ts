import { type ModelUsageType } from "./ModelUsage";

export type ServiceName = "anthropic" | "ollama";

export interface Tool {
    name: string;
    description: string;
    input_schema: any;
}

export interface ToolCall {
    id: string;
    name: string;
    input: any;
}

export interface Options {
    service?: ServiceName;
    messages?: Message[];
    model?: string;
    baseUrl?: string;
    apiKey?: string;
    stream?: boolean;
    max_tokens?: number;
    max_thinking_tokens?: number;
    extended?: boolean;
    think?: boolean;
    parser?: Parser;
    tools?: Tool[];
    json?: boolean;
    temperature?: number;
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
    tool_calls?: ToolCall[];
}

export interface PartialStreamResponse {
    service: ServiceName;
    think: boolean;
    options: Options;
    stream: AsyncGenerator<string> | AsyncGenerator<Record<string, string | InputOutputTokens>>;
    complete: () => Promise<StreamResponse>;
}

export interface StreamResponse extends Response {
}

export type MessageRole = "user" | "assistant" | "system" | "thinking" | "tool_call";
export type MessageContent = string | Tool | any;

export interface Message {
    role: MessageRole;
    content: MessageContent;
}

export type Parser = (chunk: any) => string | InputOutputTokens | null;

export interface Parsers {
    [key: string]: Parser;
}

export type Input = string | Message[];

export type Model = ModelUsageType & {
    name?: string;
    created?: Date;
    raw?: any;
}
