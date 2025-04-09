import OpenAI from "./openai.js";

const ENDPOINT = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.1-8b-instant";

export default async function Groq(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.GROQ_API_KEY;
    }

    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Groq.defaultModel = MODEL;
