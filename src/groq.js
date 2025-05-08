import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";

const ENDPOINT = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.1-8b-instant";

export default async function Groq(messages, options = {}, llmjs = null) {
    let apikey = getApiKey(options, "GROQ_API_KEY");
    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Groq.defaultModel = MODEL;

Groq.getLatestModels = async function (options = {}) {
    options.service = "groq";
    options.endpoint = ENDPOINT;

    if (!options.apikey) {
        options.apikey = getApiKey(options, "GROQ_API_KEY");
    }

    return await OpenAI.getLatestModels(options);
}