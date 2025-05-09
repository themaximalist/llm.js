import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";

const ENDPOINT = "https://api.anthropic.com/v1/";
const MODEL = "claude-3-7-sonnet-latest";

export default async function Anthropic(messages, options = {}, llmjs = null) {
    let apikey = getApiKey(options, "ANTHROPIC_API_KEY");
    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Anthropic.defaultModel = MODEL;

Anthropic.getLatestModels = async function (options = {}) {
    let apikey = getApiKey(options, "ANTHROPIC_API_KEY");
    const url = `${ENDPOINT}models`;
    const response = await fetch(url, {
        headers: {
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": apikey,
        },
    });
    const data = await response.json();
    if (!data.data) {
        return [];
    }

    return data.data.filter(model => model.type === "model").map(model => {
        return {
            name: model.display_name,
            model: model.id,
            service: "anthropic",
        }
    });
}

Anthropic.testConnection = async function (options = {}) {
    return (await Anthropic.getLatestModels(options)).length > 0;
}