import OpenAI from "./openai.js";

const ENDPOINT = "http://localhost:8080/v1";
const MODEL = "llamafile";

export default async function LlamaFile(messages, options = {}, llmjs = null) {
    if (!options.model) { options.model = MODEL }

    const opts = {
        endpoint: ENDPOINT,
        apikey: "llamafile",
        ...options,
    }

    if (LlamaFile.isLocal) {
        opts.local = true;
    }

    return await OpenAI(messages, opts, llmjs);
}

LlamaFile.defaultModel = MODEL;
LlamaFile.isLocal = true;