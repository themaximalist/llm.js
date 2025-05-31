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
        if (isExtended) {


            async function stream_extended_response(response) {
                const stream = stream_usage_response(response);

                let completed = false;

                const usage = {
                    input_tokens: 0,
                    output_tokens: 0,
                    input_cost: 0,
                    output_cost: 0,
                    cost: 0,
                };

                async function* restream_extended_response() {
                    let buffer = "";
                    for await (const chunk of stream) {
                        if (typeof chunk === "object" && chunk.usage) {
                            usage.input_tokens = chunk.usage.input_tokens;
                            usage.output_tokens = chunk.usage.output_tokens;
                            const cost = LLM.costForModelTokens("anthropic", options.model, usage.input_tokens, usage.output_tokens, llmjs.overrides, isLocal);
                            if (cost) {
                                usage.input_cost = cost.input_cost;
                                usage.output_cost = cost.output_cost;
                                usage.cost = cost.cost;
                            }
                        } else if (typeof chunk === "string") {
                            buffer += chunk;
                            yield chunk;
                        }
                    }

                    if (buffer) llmjs.assistant(buffer);
                }

                const extended = {
                    model: opts.model,
                    service: "anthropic",
                    options: opts,
                    messages,
                    stream: restream_extended_response(),
                    complete: async () => {
                        if (completed) throw new Error("Already completed");
                        completed = true;

                        const completion = {
                            ...extended,
                            messages: llmjs.messages,
                            usage,
                        };

                        delete completion.stream;
                        return completion;
                    },
                };

                return extended;
            }

            return stream_extended_response(response);
        } else {
            return stream_response(response);
        }
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



async function* stream_response(response) {
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

async function* stream_usage_response(response) {

    let input_tokens = 0;
    let output_tokens = 0;

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

                let obj = null;

                try {
                    obj = JSON.parse(jsonData);
                } catch (e) {
                    //
                }

                if (!obj) continue;
                
                // Only process content_block_delta events
                if (currentEvent === "content_block_delta") {
                    if (obj.type === "content_block_delta" && 
                        obj.delta && 
                        obj.delta.type === "text_delta" && 
                        obj.delta.text) {
                        yield obj.delta.text;
                    }
                } else if (obj.message?.usage && obj.message?.usage.input_tokens) {
                    input_tokens = obj.message.usage.input_tokens;
                } else if (obj.usage && obj.usage.output_tokens) {
                    output_tokens = obj.usage.output_tokens;
                } else {
                    // console.log("EVENT", jsonData);
                }
            }
        }

        const usage = {
            input_tokens,
            output_tokens,
        };

        yield { usage };

        // console.log("INPUT TOKENS", input_tokens);
        // console.log("OUTPUT TOKENS", output_tokens);



        // if (chunk.usage) {
        //     usage = true;
        //     yield { usage: chunk.usage };
        // }

        // if (chunk.finish_reason) {
        //     finish_reason = true;
        //     yield { finish_reason: chunk.finish_reason };
        // }

        // if (usage && finish_reason) {
        //     break;
        // }
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