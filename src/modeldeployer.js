import debug from "debug";
const log = debug("llm.js:modeldeployer");

import fetch from "node-fetch"

import { serviceForModel, stream_response } from "./utils.js"
import { MODELDEPLOYER } from "./services.js"

// TODO: update
const ENDPOINT = "http://127.0.0.1:3000/api/v1/chat";
const MODEL = "modeldeployer/llamafile";

function parseUrl(str) {
    const url = new URL(str);
    if (url.protocol !== "modeldeployer:") { throw new Error("Invalid protocol") }
    return url.host;
}

export default async function ModelDeployer(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { throw new Error("No api key provided, ex: modeldeployer://api-key-goes-here") }

    const apikey = parseUrl(options.model);
    if (!apikey) { throw new Error("Invalid api key provided, ex: modeldeployer://api-key-goes-here") }

    const body = { messages, options: {} };
    if (typeof options.max_tokens === "number") { body.options.max_tokens = options.max_tokens }
    if (typeof options.temperature === "number") { body.options.temperature = options.temperature }
    if (typeof options.seed === "number") { body.options.seed = options.seed }
    if (typeof options.schema === "string") { body.options.grammar = options.schema } // BNFS
    if (typeof options.schema === "object") { body.options.schema = options.schema }
    if (typeof options.stream === "boolean") { body.options.stream = options.stream }

    log(`sending to ${ENDPOINT} with body ${JSON.stringify(body)}`);

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apikey,
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    }

    const payload = await response.json();

    if (!payload) { throw new Error(`No data returned from server`) }
    if (payload.error) { throw new Error(payload.error) }
    if (!payload.ok) { throw new Error(`Invalid data returned from server`) }

    return payload.data;
}