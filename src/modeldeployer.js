import debug from "debug";
const log = debug("llm.js:modeldeployer");

import fetch from "node-fetch"

import { serviceForModel, stream_response } from "./utils.js"
import { MODELDEPLOYER } from "./services.js"

const ENDPOINT = "http://127.0.0.1:3000/api/v1/chat";
const MODEL = "modeldeployer/llamafile";

export default async function ModelDeployer(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

    let model = options.model || MODEL;

    if (serviceForModel(model) === MODELDEPLOYER) {
        const parts = model.split("/");
        if (parts.length === 2 && parts[1].length > 0) {
            const new_model = parts[1];
            try {
                if (serviceForModel(new_model)) {
                    model = new_model;
                }
            } catch (e) {
            }
        }
    }

    const body = {
        messages,
        options: { model }
    };

    if (typeof options.max_tokens === "number") { body.options.max_tokens = options.max_tokens }
    if (typeof options.temperature === "number") { body.options.temperature = options.temperature }
    if (typeof options.seed === "number") { body.options.seed = options.seed }
    if (typeof options.schema === "string") { body.options.grammar = options.schema } // BNFS
    if (typeof options.schema === "object") { body.options.schema = options.schema }
    if (typeof options.stream === "boolean") { body.options.stream = options.stream }

    log(`sending to ${ENDPOINT} with body ${JSON.stringify(body)}`);

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    }

    const payload = await response.json();
    if (!payload || !payload.ok) { throw new Error(`No data returned from server`) }

    return payload.data;
}