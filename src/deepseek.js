import OpenAI from "./openai.js";

const ENDPOINT = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

export default async function DeepSeek(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.DEEPSEEK_API_KEY;
    }

    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

DeepSeek.defaultModel = MODEL;
