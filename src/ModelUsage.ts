import data from "../data/model_prices_and_context_window.json";

let modelData = data;

import type { ServiceName, QualityFilter } from "./LLM.types";

let customModels: Record<string, ModelUsageType> = {
};

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
    supported_modalities: string[];
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
        return this.getByService(service).find(m => m.model === model) || null;
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
                supports_reasoning: m.supports_reasoning || false,
                supported_modalities,
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