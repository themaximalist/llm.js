import OpenAI from "./openai.js";

const ENDPOINT = "https://api.x.ai/v1";
const MODEL = "grok-3-latest";

const overrides = {
    "grok/grok-3-latest": {
        "max_tokens": 131072,
        "max_input_tokens": 131072,
        "max_output_tokens": 131072,
        "input_cost_per_token": 0.000003,
        "output_cost_per_token": 0.000015,
        "litellm_provider": "xai",
        "mode": "chat",
        "supports_function_calling": true,
        "supports_tool_choice": true
    },
    "grok/grok-3-beta": {
        "max_tokens": 131072,
        "max_input_tokens": 131072,
        "max_output_tokens": 131072,
        "input_cost_per_token": 0.000003,
        "output_cost_per_token": 0.000015,
        "litellm_provider": "xai",
        "mode": "chat",
        "supports_function_calling": true,
        "supports_tool_choice": true
    },
    "grok-3-mini-beta": {
        "max_tokens": 131072,
        "max_input_tokens": 131072,
        "max_output_tokens": 131072,
        "input_cost_per_token": 0.0000003,
        "output_cost_per_token": 0.0000005,
        "litellm_provider": "xai",
        "mode": "chat",
        "supports_function_calling": true,
        "supports_tool_choice": true
    }
};


export default async function Grok(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.GROK_API_KEY;
    }

    if (!options.model) { options.model = MODEL }

    // add overrides for now
    for (const override of Object.keys(overrides)) {
        llmjs.overrides[override] = overrides[override];
    }

    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Grok.defaultModel = MODEL;
