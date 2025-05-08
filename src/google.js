import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/";
const MODEL = "gemini-2.0-flash";

export default async function Google(messages, options = {}, llmjs = null) {

    let apikey = null;
    if (typeof options.apikey === "string") {
        apikey = options.apikey
    } else {
        apikey = process.env.GOOGLE_API_KEY;
    }

    if (!options.model) { options.model = MODEL }


    const opts = {
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    return await OpenAI(messages, opts, llmjs);
}

Google.defaultModel = MODEL;

Google.getLatestModels = async function (options = {}) {
    options.service = "google";
    options.endpoint = ENDPOINT;

    if (!options.apikey) {
        options.apikey = getApiKey(options, "GOOGLE_API_KEY");
    }

    return await OpenAI.getLatestModels(options);
}
