import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/";
const MODEL = "gemini-2.0-flash";

const DEFAULT_HEADERS = {
    "x-stainless-arch": null,
    "x-stainless-lang": null,
    "x-stainless-os": null,
    "x-stainless-package-version": null,
    "x-stainless-retry-count": null,
    "x-stainless-runtime": null,
    "x-stainless-runtime-version": null,
    "x-stainless-timeout": null,
};

export default async function Google(messages, options = {}, llmjs = null) {

    let apikey = getApiKey(options, "GOOGLE_API_KEY");

    if (options.dangerouslyAllowBrowser) {
        options.defaultHeaders = DEFAULT_HEADERS;
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

    if (options.dangerouslyAllowBrowser) {
        options.defaultHeaders = DEFAULT_HEADERS;
    }

    if (!options.apikey) {
        options.apikey = getApiKey(options, "GOOGLE_API_KEY");
    }

    return await OpenAI.getLatestModels(options);
}
