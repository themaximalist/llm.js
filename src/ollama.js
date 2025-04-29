import OpenAI from "./openai.js";

const ENDPOINT = "http://localhost:11434/v1";
const MODEL = "llama3.2:1b";

export default async function Ollama(messages, options = {}, llmjs = null) {
    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey: "ollama",
        ...options,
    }

    if (Ollama.isLocal) {
        opts.local = true;
    }

    return await OpenAI(messages, opts, llmjs);
}

Ollama.defaultModel = MODEL;
Ollama.isLocal = true;