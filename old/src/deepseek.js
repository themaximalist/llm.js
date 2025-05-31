import OpenAI from "./openai.js";

const ENDPOINT = "https://api.deepseek.com";
const MODEL = "deepseek-chat";
import { getApiKey } from "./utils.js";

export default async function DeepSeek(messages, options = {}, llmjs = null) {

    let apikey = getApiKey(options, "DEEPSEEK_API_KEY");

    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

DeepSeek.defaultModel = MODEL;


DeepSeek.getLatestModels = async function (options = {}) {
    options.service = "deepseek";
    options.endpoint = ENDPOINT;
    if (!options.apikey) {
        options.apikey = getApiKey(options, "DEEPSEEK_API_KEY");
    }

    return await OpenAI.getLatestModels(options);
}

DeepSeek.testConnection = async function (options = {}) {
    return await OpenAI.testConnection(options);
}