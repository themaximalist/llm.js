import debug from "debug";
const log = debug("llm.js:together");

import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";

const ENDPOINT = "https://api.together.xyz/v1";
const MODEL = "meta-llama/Llama-3-70b-chat-hf";

export default async function Together(messages, options = {}, llmjs = null) {
    let apikey = getApiKey(options, "TOGETHER_API_KEY");

    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}



Together.defaultModel = MODEL;

Together.getLatestModels = async function (options = {}) {
    let apikey = getApiKey(options, "TOGETHER_API_KEY");
    const url = `${ENDPOINT}/models`;
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json", 
            "Accept": "application/json",
            "Authorization": `Bearer ${apikey}`,
        },
    });
    const data = await response.json();

    if (!data) {
        return [];
    }


    return data.filter(model => model.object === "model" && model.type === "chat").map(model => {
        return {
            name: model.display_name,
            model: model.id,
            created_at: new Date(model.created * 1000),
            service: "together",
            raw: model,
        }
    });
}

Together.testConnection = async function (options = {}) {
    try {
        return (await Together.getLatestModels(options)).length > 0;
    } catch (error) {
        return false;
    }
}