import OpenAI from "./openai.js";

const ENDPOINT = "https://api.anthropic.com/v1/";
const MODEL = "claude-3-7-sonnet-latest";

export default async function Anthropic(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.ANTHROPIC_API_KEY;
    }

    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Anthropic.defaultModel = MODEL;
