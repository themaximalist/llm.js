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

Ollama.getLatestModels = async function () {
    const url = ENDPOINT.replace("/v1", "/api/tags");
    const response = await fetch(url);
    const data = await response.json();
    return data.models.map(model => {
        return {
            model: model.name,
            service: "ollama",
        }
    });
}