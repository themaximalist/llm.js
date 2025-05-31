import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";
import { json } from "./parsers.js";
import LLM from "./index.js";

const ENDPOINT = "https://api.anthropic.com/v1/";
const MODEL = "claude-3-7-sonnet-latest";
const DEFAULT_MAX_TOKENS = 32000;

export default async function Anthropic(messages, options = {}, llmjs = null) {
    let apikey = getApiKey(options, "ANTHROPIC_API_KEY");
    const endpoint = options.endpoint || ENDPOINT;
    if (!options.model) { options.model = MODEL }

    const isExtended = options.extended;
    const isLocal = false;

    const opts = {
        model: options.model || MODEL,
        endpoint: ENDPOINT,
        apikey,
        ...options,
    }

    const modelInfo = LLM.getModelInfo(opts.model);

    delete opts.service;
    delete opts.apikey;
    delete opts.endpoint;
    delete opts.json;
    delete opts.extended;

    let eventEmitter = null;
    if (opts.eventEmitter) {
        eventEmitter = opts.eventEmitter;
        delete opts.eventEmitter;
    }

    if (typeof opts.max_tokens === "undefined") {
        opts.max_tokens = modelInfo?.max_tokens || DEFAULT_MAX_TOKENS;
    }

    const signal = new AbortController();
    if (eventEmitter) {
        eventEmitter.on('abort', () => signal.abort());
    }

    const body = {
        ...opts,
        messages,
    };

    const url = `${endpoint}messages`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": apikey,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: signal.signal,
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    } else {
        const data = await response.json();
        const text = data.content[0].text;

        const content = (options.json) ? json(text) : text;

        if (isExtended) {
            const input_tokens = data.usage.input_tokens || 0;
            const output_tokens = data.usage.output_tokens || 0;
            const cost = LLM.costForModelTokens("anthropic", options.model, input_tokens, output_tokens, llmjs.overrides, isLocal);

            const extended_response = {
                options: opts,
                messages,
                response: content,
                usage: {
                    input_tokens,
                    output_tokens,
                },
            }

            if (cost && typeof cost === "object") {
                extended_response.usage = Object.assign(extended_response.usage, cost);
            }

            if (isLocal) {
                extended_response.usage.local = true;
            }

            return extended_response;
        } else {
            return content;
        }
    }
}

export async function* stream_response(response) {
    const textDecoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of response.body) {
        const data = textDecoder.decode(chunk);
        buffer += data;

        // Process complete lines
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        let currentEvent = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === "") {
                // Empty line resets the event
                currentEvent = null;
                continue;
            }
            
            if (trimmedLine.startsWith("event: ")) {
                currentEvent = trimmedLine.slice(7).trim();
                continue;
            }
            
            if (trimmedLine.startsWith("data: ")) {
                const jsonData = trimmedLine.slice(6);
                
                // Only process content_block_delta events
                if (currentEvent === "content_block_delta") {
                    try {
                        const obj = JSON.parse(jsonData);
                        if (obj.type === "content_block_delta" && 
                            obj.delta && 
                            obj.delta.type === "text_delta" && 
                            obj.delta.text) {
                            yield obj.delta.text;
                        }
                    } catch (e) {
                        // JSON parsing failed, likely incomplete data
                        // We'll try again with the next chunk
                        // console.warn("Failed to parse JSON chunk:", jsonData);
                    }
                }
            }
        }
    }
}

Anthropic.defaultModel = MODEL;

Anthropic.getLatestModels = async function (options = {}) {
    let apikey = getApiKey(options, "ANTHROPIC_API_KEY");
    const url = `${ENDPOINT}models`;
    const response = await fetch(url, {
        headers: {
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": apikey,
        },
    });
    const data = await response.json();
    if (!data.data) {
        return [];
    }

    return data.data.filter(model => model.type === "model").map(model => {
        return {
            name: model.display_name,
            model: model.id,
            created_at: new Date(model.created_at),
            service: "anthropic",
        }
    });
}

Anthropic.testConnection = async function (options = {}) {
    return (await Anthropic.getLatestModels(options)).length > 0;
}