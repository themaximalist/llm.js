import data from "../data/model_prices_and_context_window.json";

import type { ServiceName } from "./LLM.types";

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

export default class ModelUsage {
    static readonly DEFAULT_BASE_URL: string = "https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json";

    static get(service?: ServiceName): ModelUsageType[] {
        return this.factories(data).filter(this.filter(service));
    }

    static filter(service?: ServiceName): (model: ModelUsageType) => boolean {
        return (model: ModelUsageType) => {
            if (model.mode !== "chat") return false;
            if (service === "google" && model.service === "gemini") return true;
            return service ? model.service === service : true;
        }
    }

    static factories(data: any): ModelUsageType[] {
        return Object.keys(data).map(key => {
            const max_input_tokens = data[key].max_input_tokens || 0;
            const max_output_tokens = data[key].max_output_tokens || 0;
            const max_tokens = (data[key].max_tokens ? data[key].max_tokens : max_input_tokens + max_output_tokens);

            const input_cost_per_token = data[key].input_cost_per_token || 0;
            const output_cost_per_token = data[key].output_cost_per_token || 0;
            const output_cost_per_reasoning_token = data[key].output_cost_per_reasoning_token || 0;

            const supported_modalities = data[key].supported_modalities || [];

            let model = key;
            if (key.includes("/")) model = key.split("/").slice(1).join("/");

            return {
                service: data[key].litellm_provider,
                mode: data[key].mode,
                model,
                max_tokens,
                max_input_tokens,
                max_output_tokens,
                input_cost_per_token,
                output_cost_per_token,
                output_cost_per_reasoning_token,
                supports_reasoning: data[key].supports_reasoning || false,
                supported_modalities,
            }
        });
    }

    static async refresh(service?: ServiceName): Promise<ModelUsageType[]> {
        const response = await fetch(this.DEFAULT_BASE_URL);
        const data = await response.json();
        return this.factories(data).filter(this.filter(service));
    }
}