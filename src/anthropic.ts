import LLM, { type Model, type ServiceName } from "./LLM";

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static DEFAULT_MODEL: string = "claude-opus-4-20250514";
    static API_VERSION: string = "2023-06-01";

    get chatUrl() { return `${this.baseUrl}/messages` }
    get modelsUrl() { return `${this.baseUrl}/models` }
    get llmHeaders() {
        return Object.assign({
            "anthropic-version": Anthropic.API_VERSION,
        }, super.llmHeaders);
    }

    parseUsage(data: any) {
        return {
            input_tokens: data.usage.input_tokens,
            output_tokens: data.usage.output_tokens,
        };
    }

    parseContent(data: any): string {
        if (!data.content) return "";
        if (!data.content[0]) return "";
        if (!data.content[0].text) return "";
        return data.content[0].text;
    }

    parseChunkContent(chunk: any): string {
        if (chunk.type !== "content_block_delta") return "";
        if (!chunk.delta) return "";
        if (chunk.delta.type !== "text_delta") return "";
        if (!chunk.delta.text) return "";
        return chunk.delta.text;
    }

    parseModel(model: any): Model {
        return {
            name: model.display_name,
            model: model.id,
            created: new Date(model.created_at),
        } as Model;
    }


}