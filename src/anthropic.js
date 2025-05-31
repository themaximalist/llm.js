import OpenAI from "./openai.js";
import { getApiKey } from "./utils.js";
import { json } from "./parsers.js";
import LLM from "./index.js";

const ENDPOINT = "https://api.anthropic.com/v1/";
const MODEL = "claude-3-7-sonnet-latest";
const DEFAULT_MAX_TOKENS = 32000;

/**
 * Main Anthropic API function
 * Handles both streaming and non-streaming responses, with optional extended format
 */
export default async function Anthropic(messages, options = {}, llmjs = null) {
    const config = prepareConfig(options);
    const response = await makeApiRequest(messages, config);
    // console.log("RESPONSE", response);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (options.stream) {
        return handleStreamingResponse(response, config, options, llmjs, messages);
    } else {
        return handleRegularResponse(response, config, options, llmjs, messages);
    }
}

/**
 * Prepare configuration for the API request
 */
function prepareConfig(options) {
    const apikey = getApiKey(options, "ANTHROPIC_API_KEY");
    const endpoint = options.endpoint || ENDPOINT;
    const model = options.model || MODEL;
    const modelInfo = LLM.getModelInfo(model);
    
    const config = {
        apikey,
        endpoint,
        model,
        isExtended: options.extended,
        isLocal: false,
        max_tokens: options.max_tokens ?? modelInfo?.max_tokens ?? DEFAULT_MAX_TOKENS,
    };

    // Create clean options for the API request
    const apiOptions = { ...options };
    
    // Remove non-API options
    const keysToDelete = ['service', 'apikey', 'endpoint', 'json', 'extended', 'eventEmitter'];
    keysToDelete.forEach(key => delete apiOptions[key]);
    
    // Set defaults
    apiOptions.model = model;
    apiOptions.max_tokens = config.max_tokens;
    
    // Handle abort signal
    const signal = new AbortController();
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => signal.abort());
    }
    
    return {
        ...config,
        apiOptions,
        signal: signal.signal,
    };
}

/**
 * Make the API request to Anthropic
 */
async function makeApiRequest(messages, config) {
    const url = `${config.endpoint}messages`;
    const body = {
        ...config.apiOptions,
        messages,
    };

    return fetch(url, {
        method: "POST",
        headers: {
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
            "x-api-key": config.apikey,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: config.signal,
    });
}

/**
 * Handle regular (non-streaming) responses
 */
async function handleRegularResponse(response, config, options, llmjs, messages) {
    const data = await response.json();

    // Extract text and thinking from content array
    let text = '';
    let thinking = null;
    
    if (Array.isArray(data.content)) {
        for (const contentItem of data.content) {
            if (contentItem.type === 'text') {
                text += contentItem.text;
            } else if (contentItem.type === 'thinking') {
                thinking = contentItem.thinking;
            }
        }
    } else {
        // Fallback for old format
        text = data.content[0]?.text || '';
    }
    
    const content = options.json ? json(text) : text;

    if (!config.isExtended) {
        return content;
    }

    // Build extended response
    const usage = calculateUsage(
        data.usage.input_tokens || 0,
        data.usage.output_tokens || 0,
        config.model,
        llmjs?.overrides,
        config.isLocal
    );

    const extendedResponse = {
        options: config.apiOptions,
        messages,
        response: content,
        usage,
    };
    
    // Add thinking if present
    if (thinking) {
        extendedResponse.thinking = thinking;
    }

    return extendedResponse;
}

/**
 * Handle streaming responses
 */
function handleStreamingResponse(response, config, options, llmjs, messages) {
    if (!config.isExtended) {
        return streamTextOnly(response);
    }

    return createExtendedStream(response, config, options, llmjs, messages);
}

/**
 * Create an extended streaming response object
 */
function createExtendedStream(response, config, options, llmjs, messages) {
    const stream = streamWithUsage(response);
    let completed = false;
    
    const usage = {
        input_tokens: 0,
        output_tokens: 0,
        input_cost: 0,
        output_cost: 0,
        cost: 0,
    };

    let collectedThinking = '';
    let collectedResponse = '';

    async function* extendedStreamGenerator() {
        let buffer = "";
        
        for await (const chunk of stream) {
            console.log("CHUNK", chunk);
            if (chunk.type === 'usage') {
                usage.input_tokens = chunk.usage.input_tokens;
                usage.output_tokens = chunk.usage.output_tokens;
                
                const cost = calculateCost(
                    usage.input_tokens,
                    usage.output_tokens,
                    config.model,
                    llmjs?.overrides,
                    config.isLocal
                );
                
                if (cost) {
                    Object.assign(usage, cost);
                }
            } else if (chunk.type === 'thinking') {
                collectedThinking += chunk.text;
                yield { thinking: chunk.text };
            } else if (chunk.type === 'text') {
                buffer += chunk.text;
                collectedResponse += chunk.text;
                yield { response: chunk.text };
            }
        }

        if (buffer && llmjs) {
            llmjs.assistant(buffer);
        }
    }

    return {
        model: config.apiOptions.model,
        service: "anthropic",
        options: config.apiOptions,
        messages,
        stream: extendedStreamGenerator(),
        complete: async () => {
            if (completed) {
                throw new Error("Already completed");
            }
            completed = true;

            const completion = {
                model: config.apiOptions.model,
                service: "anthropic",
                options: config.apiOptions,
                messages: llmjs?.messages || messages,
                usage,
                response: collectedResponse,
            };

            // Add thinking if present
            if (collectedThinking) {
                completion.thinking = collectedThinking;
            }

            return completion;
        },
    };
}

/**
 * Stream only text content (simple streaming)
 */
async function* streamTextOnly(response) {
    const parser = new SSEParser();
    
    for await (const chunk of response.body) {
        const events = parser.parse(chunk);
        
        for (const event of events) {
            if (event.type === 'content_block_delta' && event.data.delta?.text) {
                yield event.data.delta.text;
            }
        }
    }
}

/**
 * Stream with usage information
 */
async function* streamWithUsage(response) {
    const parser = new SSEParser();
    let input_tokens = 0;
    let output_tokens = 0;
    let currentBlockId = null;
    let isThinkingBlock = false;
    
    for await (const chunk of response.body) {
        const events = parser.parse(chunk);
        
        for (const event of events) {
            // Handle content block start to identify thinking blocks
            if (event.type === 'content_block_start' && event.data.content_block) {
                currentBlockId = event.data.index;
                isThinkingBlock = event.data.content_block.type === 'thinking';
            }
            
            // Handle delta events
            if (event.type === 'content_block_delta') {
                if (event.data.delta.type === "thinking_delta") {
                    yield { type: 'thinking', text: event.data.delta.thinking };
                } else if (event.data.delta.type === "text_delta") {
                    yield { type: 'text', text: event.data.delta.text };
                }
            } else if (event.data.message?.usage?.input_tokens) {
                input_tokens = event.data.message.usage.input_tokens;
            } else if (event.data.usage?.output_tokens) {
                output_tokens = event.data.usage.output_tokens;
            }
            
            // Reset block tracking on stop
            if (event.type === 'content_block_stop') {
                currentBlockId = null;
                isThinkingBlock = false;
            }
        }
    }
    
    // Yield final usage
    yield { 
        type: 'usage', 
        usage: { input_tokens, output_tokens } 
    };
}

/**
 * Server-Sent Events parser for Anthropic's streaming format
 */
class SSEParser {
    constructor() {
        this.textDecoder = new TextDecoder();
        this.buffer = "";
    }

    parse(chunk) {
        const events = [];
        const data = this.textDecoder.decode(chunk);
        this.buffer += data;

        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";

        let currentEvent = null;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === "") {
                currentEvent = null;
                continue;
            }

            if (trimmedLine.startsWith("event: ")) {
                currentEvent = trimmedLine.slice(7).trim();
                continue;
            }

            if (trimmedLine.startsWith("data: ")) {
                const jsonData = trimmedLine.slice(6);
                // console.log("JSON DATA", jsonData);

                try {
                    const obj = JSON.parse(jsonData);
                    events.push({
                        type: currentEvent,
                        data: obj,
                    });
                } catch (e) {
                    // Ignore parse errors - likely incomplete data
                }
            }
        }

        return events;
    }
}

/**
 * Calculate token usage and costs
 */
function calculateUsage(inputTokens, outputTokens, model, overrides, isLocal) {
    const usage = {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
    };

    const cost = calculateCost(inputTokens, outputTokens, model, overrides, isLocal);
    if (cost) {
        Object.assign(usage, cost);
    }

    if (isLocal) {
        usage.local = true;
    }

    return usage;
}

/**
 * Calculate costs for tokens
 */
function calculateCost(inputTokens, outputTokens, model, overrides, isLocal) {
    return LLM.costForModelTokens(
        "anthropic",
        model,
        inputTokens,
        outputTokens,
        overrides,
        isLocal
    );
}

// Static methods
Anthropic.defaultModel = MODEL;

Anthropic.getLatestModels = async function (options = {}) {
    const apikey = getApiKey(options, "ANTHROPIC_API_KEY");
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

    return data.data
        .filter(model => model.type === "model")
        .map(model => ({
            name: model.display_name,
            model: model.id,
            created_at: new Date(model.created_at),
            service: "anthropic",
        }));
};

Anthropic.testConnection = async function (options = {}) {
    return (await Anthropic.getLatestModels(options)).length > 0;
};