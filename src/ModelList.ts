import data from "../data/model_prices_and_context_window.json";

import { ServiceName } from "./LLM.js";

type Model = {
    mode: string;
    service: string;
    model: string;
    max_tokens: number;
    max_input_tokens: number;
    max_output_tokens: number;
    input_cost_per_token: number;
    output_cost_per_token: number;
    output_cost_per_reasoning_token: number;
}

export default class ModelList {
    static readonly DEFAULT_BASE_URL: string = "https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json";

    static get(service?: ServiceName): Model[] {
        return this.factories(data).filter(this.filter(service));
    }

    static filter(service?: ServiceName): (model: Model) => boolean {
        return (model: Model) => {
            if (model.mode !== "chat") return false;
            return service ? model.service === service : true;
        }
    }

    static factories(data: any): Model[] {
        return Object.keys(data).map(key => {
            const max_input_tokens = data[key].max_input_tokens || 0;
            const max_output_tokens = data[key].max_output_tokens || 0;
            const max_tokens = (data[key].max_tokens ? data[key].max_tokens : max_input_tokens + max_output_tokens);

            const input_cost_per_token = data[key].input_cost_per_token || 0;
            const output_cost_per_token = data[key].output_cost_per_token || 0;
            const output_cost_per_reasoning_token = data[key].output_cost_per_reasoning_token || 0;

            return {
                service: data[key].litellm_provider,
                mode: data[key].mode,
                model: key,
                max_tokens,
                max_input_tokens,
                max_output_tokens,
                input_cost_per_token,
                output_cost_per_token,
                output_cost_per_reasoning_token,
            }
        });
    }

    static async refresh(service?: ServiceName): Promise<Model[]> {
        const response = await fetch(this.DEFAULT_BASE_URL);
        const data = await response.json();
        return this.factories(data).filter(this.filter(service));
    }
}