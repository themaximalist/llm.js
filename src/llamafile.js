import debug from "debug";
const log = debug("llm.js:llamafile");

import fetch from "cross-fetch";

import { jsonSchemaToBFNS, stream_response } from "./utils.js";

const ENDPOINT = "http://127.0.0.1:8080/completion";
const MODEL = "LLaMA_CPP";

const USER_PROMPT = "### User:";
const ASSISTANT_PROMPT = "### Assistant:";

export default async function LlamaFile(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

    const body = {
        model: options.model || MODEL,
        prompt: format_prompt(messages),
        stop: [`\n${USER_PROMPT}`],
    };

    if (typeof options.max_tokens === "number") { body.n_predict = options.max_tokens }
    if (typeof options.temperature === "number") { body.temperature = options.temperature }
    if (typeof options.seed === "number") { body.seed = options.seed }
    if (typeof options.schema === "string") { body.grammar = options.schema }
    if (typeof options.schema === "object") { body.grammar = jsonSchemaToBFNS(options.schema) }
    if (typeof options.stream === "boolean") { body.stream = options.stream }

    log(`sending to ${ENDPOINT} with body ${JSON.stringify(body)}`);

    const signal = new AbortController();
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => { signal.abort() });
    }

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer no-key" },
        body: JSON.stringify(body),
        signal: signal.signal,
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    } else {
        const data = await response.json();

        if (options.schema) {
            return JSON.parse(data.content);
        } else {
            return data.content;
        }
    }
}

function format_prompt(messages) {
    const prompt = messages.map(message => {
        if (message.role === "system") {
            return message.content;
        } else if (message.role === "user") {
            return `${USER_PROMPT}${message.content}`;
        } else {
            return `${ASSISTANT_PROMPT}${message.content}`;
        }
    });

    prompt.push(ASSISTANT_PROMPT);

    return prompt.join("\n");
}


LlamaFile.defaultModel = MODEL;
