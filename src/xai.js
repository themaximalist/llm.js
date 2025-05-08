import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";
const ENDPOINT = "https://api.x.ai/v1";
const MODEL = "grok-3-latest";

export default async function xAI(messages, options = {}, llmjs = null) {

    let apikey = getApiKey(options, "XAI_API_KEY");

    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

xAI.defaultModel = MODEL;


xAI.getLatestModels = async function (options = {}) {
    options.service = "xai";
    options.endpoint = ENDPOINT;
    if (!options.apikey) {
        options.apikey = getApiKey(options, "XAI_API_KEY");
    }

    return await OpenAI.getLatestModels(options);
}
