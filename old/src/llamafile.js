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

LlamaFile.getLatestModels = async function (options = {}) {
    return [{
        model: "llamafile",
        created_at: new Date(),
        service: "llamafile",
    }];
}

LlamaFile.testConnection = async function (options = {}) {
    try {
        const url = ENDPOINT.replace("/v1", "/");
        const response = await fetch(url);
        const data = await response.text();
        return data.indexOf("llama.cpp") !== -1;
    } catch (error) {
        return false;
    }
}
