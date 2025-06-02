import LLM from "./LLM";
import type { ServiceName, Options } from "./LLM.types";

/** OpenAI API v1 Compatible Base CLass */
export default class APIv1 extends LLM {
    static readonly service: ServiceName = "openai";
    static DEFAULT_BASE_URL: string = "";
    static DEFAULT_MODEL: string = "";
    static isLocal: boolean = false;
    static isBearerAuth: boolean = true;

    get chatUrl() { return `${this.baseUrl}chat/completions` }
    get modelsUrl() { return `${this.baseUrl}models` }

    parseOptions(options: Options): Options {
        delete options.think;
        return options;
    }

    parseContent(data: any): string {
        if (!data) return "";
        if (!data.choices) return "";
        if (!data.choices[0]) return "";
        if (!data.choices[0].message) return "";
        return data.choices[0].message.content;
    }
}