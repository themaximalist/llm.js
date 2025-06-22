import LLM from "./LLM";
import Attachment from "./Attachment";
import type { ServiceName, Options, Model, ToolCall, Tool, MessageContent, Message } from "./LLM.types";
import { filterMessageRole, filterNotMessageRole, keywordFilter, uuid, join, deepClone } from "./utils";

/**
 * @category Message
 */
export interface GoogleMessage {
    role: "user" | "model";
    parts: Array<{ text?: string } | { inline_data?: { mime_type: string; data: string } }>;
}

/**
 * @category Tools
 */
export interface GoogleTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

/**
 * @category Options
 */
export interface GoogleOptions extends Options {
    system_instruction?: {
        parts: { text: string }[];
    }
    contents?: GoogleMessage[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        thinkingConfig?: {
            includeThoughts: boolean;
        }
    }
}

/**
 * @category LLMs
 */
export default class Google extends LLM {
    static readonly service: ServiceName = "google";
    static DEFAULT_BASE_URL: string = "https://generativelanguage.googleapis.com/v1beta/";
    static DEFAULT_MODEL: string = "gemini-2.5-flash-preview-05-20";

    get chatUrl() { return join(this.baseUrl, "chat/completions") }
    get modelsUrl() { return join(this.baseUrl, "models") }

    getChatUrl(opts: Options) {
        return join(this.baseUrl, "models", `${opts.model}:generateContent?key=${this.apiKey}`);
    }

    getModelsUrl() { return `${this.modelsUrl}?key=${this.apiKey}` }

    parseOptions(options: GoogleOptions): GoogleOptions {
        const messages = deepClone(options.messages || []).map((m: any) => {
            if (m.role === "assistant") m.role = "model";
            return m;
        });

        const system = filterMessageRole(messages, "system");
        const nonSystem = filterNotMessageRole(messages, "system");
        delete options.messages;

        if (system.length > 0) { options.system_instruction = { parts: system.map(message => ({ text: message.content })) } }
        if (nonSystem.length > 0) { options.contents = nonSystem.map(Google.toGoogleMessage) }

        if (!options.generationConfig) options.generationConfig = {};
        if (typeof options.temperature === "number") options.generationConfig.temperature = options.temperature;
        if (typeof options.max_tokens === "number") options.generationConfig.maxOutputTokens = options.max_tokens;
        if (!options.generationConfig.maxOutputTokens) options.generationConfig.maxOutputTokens = this.max_tokens;

        if (options.tools) {
            options.tools = [ { functionDeclarations: options.tools.map(tool => ({
                name: (tool as Tool).name,
                description: (tool as Tool).description,
                parameters: (tool as Tool).input_schema,
            })) } ] as any;
        }

        if (options.think) {
            if (!options.generationConfig) options.generationConfig = {};
            options.generationConfig.thinkingConfig = { includeThoughts: true };
            delete options.think;
        }

        delete options.think;
        delete options.max_tokens;
        delete options.temperature;
        delete options.stream;

        return options;
        }

    parseMessages(messages: Message[]): Message[] {
        return messages.map(message => {
            const copy = deepClone(message);
            if (copy.role === "thinking" || copy.role === "tool_call") copy.role = "assistant";

            // Don't transform attachments here - toGoogleMessage handles them properly
            if (typeof copy.content !== "string" && !(copy.content && copy.content.attachments)) {
                copy.content = JSON.stringify(copy.content);
            }

            return copy;
        });
    }

    get llmHeaders() {
        // Google needs endpoint to not send preflight...so we remove "x-" header and we're passing through query params
        const headers = super.llmHeaders;
        delete headers["x-api-key"];
        return headers;
    }
     
    parseContent(data: any): string {
        if (!data?.candidates?.[0]?.content?.parts) return "";
        const parts = data.candidates[0].content.parts as any[];
        for (const part of parts) {
            if (part.thought) continue;
            return part.text;
        }
        return "";
    }

    parseTokenUsage(data: any) {
        if (!data?.usageMetadata?.promptTokenCount || !data?.usageMetadata?.candidatesTokenCount) return null;
        const usage = data.usageMetadata;
        return { input_tokens: usage.promptTokenCount, output_tokens: usage.candidatesTokenCount };
    }

    parseModel(model: any): Model {
        return {
            name: model.displayName,
            model: model.name.replace(/^models\//, ""),
            created: new Date(), // :(
            max_input_tokens: model.inputTokenLimit,
            max_output_tokens: model.outputTokenLimit,
        } as Model;
    }

    parseTools(data: any): ToolCall[] {
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.functionCall) return [];
        const functionCall = data.candidates[0].content.parts[0].functionCall;
        return [ { id: uuid(), name: functionCall.name, input: functionCall.args, } as ToolCall ];
    }

    parseThinking(data: any): string {
        if (!data?.candidates?.[0]?.content?.parts) return "";
        const parts = data.candidates[0].content.parts as any[];
        for (const part of parts) {
            if (part.thought !== true) continue;
            return part.text;
        }
        return "";
    }

    parseAttachment(attachment: Attachment): MessageContent {
        if (attachment.isImage) {
            if (!attachment.isURL) {
                return { "inline_data": { "mime_type": attachment.contentType, "data": attachment.data } };
            }
        }

        throw new Error("Unsupported attachment type");
    }

    parseAttachmentsContent(content: MessageContent): any[] {
        const parts = content.attachments?.map(this.parseAttachment.bind(this)) || [];
        if (content.text) {
            parts.push({ text: content.text });
        }
        return parts;
    }

    filterQualityModel(model: Model): boolean {
        const keywords = ["embedding", "vision", "learnlm", "image-generation", "gemma-3", "gemma-3n", "gemini-1.5", "embedding"];
        return keywordFilter(model.model, keywords);
    }

    static toGoogleMessage(message: Message): GoogleMessage {
        if (message.content && typeof message.content === 'object' && message.content.attachments) {
            // Handle messages with attachments
            const parts: any[] = [];
            
            // Add attachments first
            for (const attachment of message.content.attachments) {
                if (attachment.type === "image" && attachment.contentType !== "url") {
                    parts.push({
                        inline_data: {
                            mime_type: attachment.contentType,
                            data: attachment.data
                        }
                    });
                }
            }
            
            // Add text if present
            if (message.content.text) {
                parts.push({ text: message.content.text });
            }
            
            return {
                role: message.role === "assistant" ? "model" : message.role as "user" | "model",
                parts
            };
        } else {
            // Handle text-only messages
            const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
            return {
                role: message.role === "assistant" ? "model" : message.role as "user" | "model",
                parts: [{ text: content }]
            };
        }
    }

    static fromGoogleMessage(googleMessage: GoogleMessage): Message {
        const parts = googleMessage.parts;
        if (parts.length === 1 && "text" in parts[0]) return { role: googleMessage.role, content: parts[0].text } as Message;
        if (parts.length === 2 && "inline_data" in parts[0] && "text" in parts[1]) return { role: googleMessage.role, content: { text: parts[1].text, attachments: [{ type: "image", contentType: parts[0].inline_data.mime_type, data: parts[0].inline_data.data }] } } as Message;
        throw new Error("Unsupported message type");
    }   
}
