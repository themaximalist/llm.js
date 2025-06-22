import { type ModelUsageType } from "./ModelUsage";
import type { OpenAITool } from "./openai";
import type Attachment from "./Attachment";

/**
 * @category Options
 */
export type ServiceName = "anthropic" | "ollama" | "openai" | "google" | "xai" | "groq" | "deepseek" | string;

/**
 * @category Tools
 */
export interface Tool {
    name: string;
    description: string;
    input_schema: any;
}

/**
 * @category Tools
 */
export interface WrappedTool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}

/**
 * @category Tools
 */
export interface ToolCall {
    id: string;
    name: string;
    input: any;
}

/**
 * @category Tools
 */
export interface StreamingToolCall {
    id?: string;
    name?: string;
    input?: string;
}

/**
 * @category Tools
 */
export interface WrappedToolCall {
    function: {
        id: string;
        name: string;
        arguments: any;
    };
}

/**
 * @category Options
 */
export interface Options {
    /** Service to use, defaults to {@link Ollama} */
    service?: ServiceName;

    /** Messages to send to the model */
    messages?: Message[];

    /** Model to use, defaults to {@link Ollama.DEFAULT_MODEL} model */
    model?: string;

    /** Base URL for the service */
    baseUrl?: string;

    /** API Key for the service, {@link Usage.local} services do not need an API key  */
    apiKey?: string;

    /** Enables streaming mode */
    stream?: boolean;

    /** Maximum number of tokens to generate */
    max_tokens?: number;

    /** Maximum number of tokens to use when thinking is enabled */
    max_thinking_tokens?: number;

    /** Returns an extended response with {@link Response}, {@link PartialStreamResponse} and {@link StreamResponse} types */
    extended?: boolean;

    /** Enables thinking mode */
    think?: boolean;

    /** Custom parser function, defaults include {@link parsers.json}, {@link parsers.xml}, {@link parsers.codeBlock} and {@link parsers.markdown} */
    parser?: ParserResponse;

    /** Tools available for the model to use, will enable {@link Options.extended} */
    tools?: Tool[] | WrappedTool[] | OpenAITool[];

    /** Enables JSON mode in LLM if available and parses output with {@link parsers.json} */
    json?: boolean;

    /** Temperature for the model */
    temperature?: number;

    /** Quality filter when dealing with model usage */
    qualityFilter?: QualityFilter;

    /** Attachments to send to the model */
    attachments?: Attachment[];
}

/**
 * @category Usage
 */
export interface InputOutputTokens {
    input_tokens: number;
    output_tokens: number;
}

/**
 * @category Usage
 */
export interface Usage extends InputOutputTokens {
    total_tokens: number;
    local: boolean;
    input_cost: number;
    output_cost: number;
    total_cost: number;
}

/**
 * @category Response
 */
export interface Response {
    service: ServiceName;
    content: string;
    options: Options;
    messages: Message[];
    thinking?: string;
    usage: Usage;
    tool_calls?: ToolCall[];
}

/**
 * @category Response
 */
export interface PartialStreamResponse {
    service: ServiceName;
    think: boolean;
    options: Options;
    stream: AsyncGenerator<string> | AsyncGenerator<Record<string, string | InputOutputTokens>>;
    complete: () => Promise<StreamResponse>;
}

/**
 * @category Response
 */
export interface StreamResponse extends Response {
}

/**
 * @category Message
 */
export type MessageRole = "user" | "assistant" | "system" | "thinking" | "tool_call";

/**
 * @category Message
 */
export type MessageContent = string | Tool | any;

/**
 * @category Message
 */
export interface Message {
    role: MessageRole;
    content: MessageContent;
}

/**
 * @category Response
 */
export type ParserResponse = (chunk: any) => string | InputOutputTokens | ToolCall[] | null;

/**
 * @category Parsers
 */
export interface Parsers {
    [key: string]: ParserResponse;
}

/**
 * @category Message
 */
export type Input = string | Message[];

export type Model = ModelUsageType & {
    name?: string;
    created?: Date;
    raw?: any;
}

export type QualityFilter = {
    allowUnknown?: boolean;
    allowSimilar?: boolean;
    topModels?: boolean;
}