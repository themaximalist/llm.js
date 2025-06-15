import data from "../data/model_prices_and_context_window.json";

let modelData = data;

import type { ServiceName, QualityFilter } from "./LLM.types";

let customModels: Record<string, ModelUsageType> = {
};

/**
 * @category Usage
 */
export type ModelTag = "reasoning" | "tools" | "images" | "search" | "audio" | "cache";

/**
 * @category Usage
 */
export type ModelUsageType = {
    mode: string;
    service: string;
    model: string;
    max_tokens: number;
    max_input_tokens: number;
    max_output_tokens: number;
    input_cost_per_token: number;
    output_cost_per_token: number;
    output_cost_per_reasoning_token: number;
    supports_reasoning: boolean;
    supports_function_calling: boolean;
    supports_vision: boolean;
    supports_web_search: boolean;
    supports_audio_input: boolean;
    supports_audio_output: boolean;
    supports_prompt_caching: boolean;
    tags: ModelTag[];
}

/**
 * @category Usage
 */
export default class ModelUsage {
    static readonly DEFAULT_BASE_URL: string = "https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json";

    service: ServiceName;

    constructor(service: ServiceName) {
        this.service = service;
    }

    getModel(model: string, quality_filter: QualityFilter = {}): ModelUsageType | null {
        return ModelUsage.get(this.service, model, quality_filter);
    }

    async refresh() {
        await ModelUsage.refresh();
    }

    models() {
        return ModelUsage.getByService(this.service);
    }

    static get(service: ServiceName, model: string, quality_filter: QualityFilter = {}): ModelUsageType | null {
        let info = this.getByServiceModel(service, model);
        if (info) return info;

        if (!quality_filter.allowSimilar) return null;

        info = this.getByServiceModel(service, `${model}-latest`);
        if (info) return info;

        info = this.getByServiceModel(service, `${model}-beta`);
        if (info) return info;

        info = this.getByServiceModel(service, `${service}/${model}`);
        if (info) return info;

        info = this.getByServiceModel(service, `${service}/${model}-beta`);
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-beta", ""));
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-thinking", ""));
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-exp", ""));
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-experimental", ""));
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-thinking-exp", ""));
        if (info) return info;

        info = this.getByServiceModel(service, model.replace("-preview", ""));
        if (info) return info;

        return null;
    }

    static getAll(): ModelUsageType[] {
        return this.factories(data).filter(this.filter());
    }

    static getByService(service?: ServiceName): ModelUsageType[] {
        return this.factories(data).filter(this.filter(service));
    }

    static getByServiceModel(service: ServiceName, model: string): ModelUsageType | null {
        return this.getByService(service).find(m => m.model === model || m.model === `${service}/${model}`) || null;
    }

    static filter(service?: ServiceName): (model: ModelUsageType) => boolean {
        return (model: ModelUsageType) => {
            if (model.mode !== "chat" && model.mode !== "responses") return false;
            if (service === "google" && model.service === "gemini") return true;
            return service ? model.service === service : true;
        }
    }

    static factories(data: any): ModelUsageType[] {
        const custom = Object.assign({}, data, customModels);

        return Object.keys(custom).map(key => {
            const m = custom[key];

            const max_input_tokens = m.max_input_tokens || 0;
            const max_output_tokens = m.max_output_tokens || 0;
            const max_tokens = (m.max_tokens ? m.max_tokens : max_input_tokens + max_output_tokens);

            const input_cost_per_token = m.input_cost_per_token || 0;
            const output_cost_per_token = m.output_cost_per_token || 0;
            const output_cost_per_reasoning_token = m.output_cost_per_reasoning_token || 0;

            const supported_modalities = m.supported_modalities || [];
            const supports_reasoning = m.supports_reasoning || false;
            const supports_function_calling = m.supports_function_calling || m.raw?.supports_function_calling || false;
            const supports_vision = m.supports_vision || m.raw?.supports_vision || false;
            const supports_web_search = m.supports_web_search || m.raw?.supports_web_search || false;
            const supports_audio_input = m.supports_audio_input || m.raw?.supports_audio_input || false;
            const supports_audio_output = m.supports_audio_output || m.raw?.supports_audio_output || false;
            const supports_prompt_caching = m.supports_prompt_caching || m.raw?.supports_prompt_caching || false;

            const tags: ModelTag[] = [];
            if (supports_reasoning) tags.push("reasoning");
            if (supports_function_calling) tags.push("tools");
            if (supports_vision) tags.push("images");
            if (supports_web_search) tags.push("search");
            if (supports_audio_input || supports_audio_output) tags.push("audio");
            if (supports_prompt_caching) tags.push("cache");

            let model = key;
            if (key.includes("/")) model = key.split("/").slice(1).join("/");

            return {
                service: m.litellm_provider || m.service,
                mode: m.mode,
                model,
                max_tokens,
                max_input_tokens,
                max_output_tokens,
                input_cost_per_token,
                output_cost_per_token,
                output_cost_per_reasoning_token,
                supports_reasoning,
                supports_function_calling,
                supports_vision,
                supports_web_search,
                supports_audio_input,
                supports_audio_output,
                supports_prompt_caching,
                supported_modalities,
                tags,
            }
        });
    }

    static async refresh(service?: ServiceName): Promise<ModelUsageType[]> {
        const response = await fetch(this.DEFAULT_BASE_URL);
        const data = await response.json();
        modelData = data;
        return this.factories(data).filter(this.filter(service));
    }

    static addCustom(info: ModelUsageType) {
        customModels[`${info.service}/${info.model}`] = Object.assign({}, { mode: "chat" }, info);
    }
    static getCustom(service: ServiceName, model: string): ModelUsageType | null { return customModels[`${service}/${model}`] || null }
    static getCustoms() { return customModels }
    static removeCustom(service: ServiceName, model: string) { delete customModels[`${service}/${model}`] }
    static clearCustom() { customModels = {} }
}