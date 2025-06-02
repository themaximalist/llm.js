import LLM from "./LLM";
import type { ServiceName, Options, Message, InputOutputTokens, Model, ToolCall } from "./LLM.types";
import { filterMessageRole, filterNotMessageRole, uuid } from "./utils";

export interface GoogleMessage {
    role: "user" | "model" | "assistant";
    content: string;
}

export interface GoogleTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
}

export interface GoogleOptions extends Options {
    system_instruction?: {
        parts: { text: string }[];
    }
    contents?: {
        parts: { text: string }[];
    }[];
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
    }
}

export default class Google extends LLM {
    static readonly service: ServiceName = "google";
    static DEFAULT_BASE_URL: string = "https://generativelanguage.googleapis.com/v1beta/";
    static DEFAULT_MODEL: string = "gemini-2.5-flash-preview-05-20";
    static isLocal: boolean = false;

    get chatUrl() { return `${this.baseUrl}/chat/completions` }
    get modelsUrl() { return `${this.baseUrl}models` }

    getChatUrl(opts: Options) {
        return `${this.baseUrl}models/${opts.model}:generateContent?key=${this.apiKey}`;
    }

    getModelsUrl() { return `${this.baseUrl}models?key=${this.apiKey}` }

    parseOptions(options: GoogleOptions): GoogleOptions {
        const messages = JSON.parse(JSON.stringify(options.messages || [])).map((m: GoogleMessage) => {
            if (m.role === "assistant") m.role = "model";
            return m;
        });

        const system = filterMessageRole(messages, "system");
        const nonSystem = filterNotMessageRole(messages, "system");
        delete options.messages;

        if (system.length > 0) { options.system_instruction = { parts: system.map(message => ({ text: message.content })) } }
        if (nonSystem.length > 0) { options.contents = nonSystem.map(message => ({ role: message.role, parts: [{ text: message.content }] })) }

        if (!options.generationConfig) options.generationConfig = {};
        if (typeof options.temperature === "number") options.generationConfig.temperature = options.temperature;
        if (typeof options.max_tokens === "number") options.generationConfig.maxOutputTokens = options.max_tokens;
        if (!options.generationConfig.maxOutputTokens) options.generationConfig.maxOutputTokens = this.max_tokens;

        if (options.tools) {
            options.tools = [ { functionDeclarations: options.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.input_schema,
            } as GoogleTool)) } ] as any;
        }

        delete options.think;
        delete options.max_tokens;
        delete options.temperature;
        delete options.stream;

        return options;
    }
     
    parseContent(data: any): string {
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) return "";
        return data.candidates[0].content.parts[0].text;
    }

    parseContentChunk(chunk: any) : string {
        if (!chunk?.candidates?.[0]?.content?.parts?.[0]?.text) return "";
        return chunk.candidates[0].content.parts[0].text;
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
        } as Model;
    }

    parseTools(data: any): ToolCall[] {
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.functionCall) return [];
        const functionCall = data.candidates[0].content.parts[0].functionCall;
        return [ { id: uuid(), name: functionCall.name, input: functionCall.args, } as ToolCall ];
    }

    // parseTools(data: any): ToolCall[] {
    //     if (!data) return [];
    //     if (!data.candidates) return [];
    //     if (!data.candidates[0]) return [];
    //     if (!data.candidates[0].content) return [];
    //     if (!data.candidates[0].content.parts) return [];
    //     if (!data.candidates[0].content.parts[0]) return [];
    //     if (!data.candidates[0].content.parts[0].functionCall) return [];
    //     const functionCall = data.candidates[0].content.parts[0].functionCall;
    //     return [ {
    //         id: crypto.randomUUID(),
    //         name: functionCall.name,
    //         input: functionCall.args,
    //     } as ToolCall ];
    // }
}
