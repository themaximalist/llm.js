import OpenAI from "./openai.js";

const ENDPOINT = "https://api.x.ai/v1";
const MODEL = "grok-3-latest";

export default async function xAI(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.XAI_API_KEY;
    }

    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

xAI.defaultModel = MODEL;
