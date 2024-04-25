import debug from "debug";
const log = debug("llm.js:modeldeployer");

import fetch from "cross-fetch"

import { stream_response } from "./utils.js"

const ENDPOINT = "http://127.0.0.1:3000/api/v1/chat";

// model deployer uses the model API key as the model. the API key here is for a user-passed API key
export default async function ModelDeployer(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { throw new Error("No api key provided, ex: modeldeployer://api-key-goes-here") }
    const apikey = options.model;

    const body = { messages, options: {} };
    // tempted to just accept everything by default...hrmm
    if (typeof options.max_tokens === "number") { body.options.max_tokens = options.max_tokens }
    if (typeof options.temperature === "number") { body.options.temperature = options.temperature }
    if (typeof options.seed === "number") { body.options.seed = options.seed }
    if (typeof options.schema === "string") { body.options.grammar = options.schema } // BNFS
    if (typeof options.schema === "object") { body.options.schema = options.schema }
    if (typeof options.tool === "object") { body.options.tool = options.tool } // openai tools
    if (typeof options.stream === "boolean") { body.options.stream = options.stream }
    if (typeof options.apikey === "string") { body.options.apikey = options.apikey }

    const endpoint = options.endpoint || ENDPOINT;
    log(`sending to ${endpoint} with body ${JSON.stringify(body)}`);

    const signal = new AbortController();
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => signal.abort());
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apikey },
        body: JSON.stringify(body),
        signal: signal.signal,
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }
    if (options.stream) { return stream_response(response) }

    const payload = await response.json();

    if (!payload) { throw new Error(`No data returned from server`) }
    if (payload.error) { throw new Error(payload.error) }
    if (!payload.ok) { throw new Error(`Invalid data returned from server`) }

    if (options.schema || options.tool || options.response_format) {
        return ModelDeployer.parseJSONResponse(payload.data);
    }

    return payload.data;
}

ModelDeployer.defaultModel = null;

// model deployer gets back a universal JSON response that is model-agnostic—we just have to re-parse it
ModelDeployer.parseJSONResponse = function (response) {
    try {
        return JSON.parse(response);
    } catch (e) {
        log(`error parsing JSON response: ${e}`);
        return response;
    }
};
