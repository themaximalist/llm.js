import OpenAI from "./openai.js";

const ENDPOINT = "https://api.anthropic.com/v1/";
const MODEL = "claude-3-7-sonnet-latest";

function getApiKey(options) {
    if (typeof options.apikey === "string") {
        return options.apikey;
    }
    return process.env.ANTHROPIC_API_KEY;
}

export default async function Anthropic(messages, options = {}, llmjs = null) {
    let apikey = getApiKey(options);
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
    let apikey = getApiKey(options);
    const url = `${ENDPOINT}/models`;
    const response = await fetch(url, {
        headers: {
            "anthropic-version": "2023-06-01",
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