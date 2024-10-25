import debug from "debug";
const log = debug("llm.js:mistral");

const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-large-latest";

export default async function Mistral(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        apiKey = process.env.MISTRAL_API_KEY;
    }

    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No Mistral API key provided") }

    const body = {
        model: options.model || MODEL,
        messages,
    };

    if (typeof options.max_tokens === "number") { body.max_tokens = options.max_tokens }
    if (typeof options.temperature === "number") { body.temperature = options.temperature }
    if (typeof options.seed === "number") { body.random_seed = options.seed }
    if (typeof options.stream === "boolean") { body.stream = options.stream }

    log(`sending to ${ENDPOINT} with body ${JSON.stringify(body)}`);

    const signal = new AbortController();
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => signal.abort());
    }

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: signal.signal,
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    } else {
        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
}


Mistral.defaultModel = MODEL;

export async function* stream_response(response) {
    const textDecoder = new TextDecoder();

    for await (const chunk of response.body) {
        let data = textDecoder.decode(chunk);

        if (!data.includes("data: ")) { continue; }

        const lines = data.split("\n");
        let buffer = "";
        for (let line of lines) {

            // remove data: if it exists
            if (line.indexOf("data: ") === 0) { line = line.slice(6); }
            line = line.trim();

            if (line.length == 0) continue;
            if (line === "[DONE]") return;

            buffer += line;

            try {
                const obj = JSON.parse(buffer);
                buffer = "";
                yield obj.choices[0].delta.content;
            } catch (e) {

            }
        }
    }
}
