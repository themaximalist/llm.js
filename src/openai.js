import debug from "debug";
const log = debug("llm.js:openai_interface");

import * as parsers from "./parsers.js";
import { OpenAI as OpenAIClient } from "openai";
import LLM from "./index.js";

const MODEL = "gpt-4o";

export default async function OpenAI(messages, options = {}, llmjs = null) {
    const service = options.service || "openai";
    const isOpenAI = service === "openai";

    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        if (isOpenAI) {
            apiKey = process.env.OPENAI_API_KEY;
        }
    }


    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No API key provided") }

    const dangerouslyAllowBrowser = options.dangerouslyAllowBrowser || false;
    const clientOptions = { apiKey, dangerouslyAllowBrowser };
    if (options.endpoint) {
        clientOptions.baseURL = options.endpoint;
        delete options.endpoint;
    }

    if (!isOpenAI && !clientOptions.baseURL) {
        throw new Error("non-OpenAI services require an endpoint");
    }

    const openai = new OpenAIClient(clientOptions);

    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

    const isO1 = isOpenAI && options.model.indexOf("o1-") !== -1;

    let networkOptions = {};
    if (options.stream) networkOptions.responseType = "stream";

    const openaiOptions = { model: options.model };

    if (options.stream) {
        openaiOptions.stream = options.stream;
        openaiOptions.stream_options = { include_usage: true };
    }

    if (typeof options.temperature !== "undefined") {
        openaiOptions.temperature = options.temperature;
        if (openaiOptions.temperature < 0) openaiOptions.temperature = 0;
        if (openaiOptions.temperature > 2) openaiOptions.temperature = 2;
    }

    // hacky: o1-mini has no temperature parameter
    if (isO1 && typeof openaiOptions.temperature !== "undefined") {
        log("o1-mini temperature force reset to 1 (only 1 is supported)");
        openaiOptions.temperature = 1;
    }

    if (typeof options.max_tokens !== "undefined") { openaiOptions.max_tokens = options.max_tokens }

    // hacky: o1-mini has a max_completion_tokens parameter
    if (isO1 && openaiOptions.max_tokens) {
        openaiOptions.max_completion_tokens = openaiOptions.max_tokens;
        delete openaiOptions.max_tokens;
    }


    if (typeof options.seed !== "undefined") { openaiOptions.seed = options.seed }

    let isJSONFormat = false;
    if (options.json) {
        isJSONFormat = true;
        if (isOpenAI) {
            openaiOptions.response_format = { "type": "json_object" };
        }
    } else if (typeof options.response_format !== "undefined") {
        isJSONFormat = true; // currently openai only supports json response_format
        openaiOptions.response_format = options.response_format;
    }

    if (options.schema && options.tools) { throw new Error("Cannot specify both schema and tools") }
    if (options.schema) {
        if (isOpenAI) {
            openaiOptions.response_format = { "type": "json_object" };
        }

        isJSONFormat = true;
    }

    if (isO1 && isJSONFormat) {
        throw new Error("O1 does not support JSON format");
    }

    let toolName = null;
    if (options.tool) {
        toolName = options.tool.name;
        openaiOptions.tools = [{ "type": "function", "function": options.tool }];
        if (options.tool_choice) { openaiOptions.tool_choice = options.tool_choice }
    }

    if (options.tools) {
        openaiOptions.tools = options.tools;
        if (options.tool_choice) { openaiOptions.tool_choice = options.tool_choice }
    }

    openaiOptions.messages = messages;

    log(`sending to ${service} with options ${JSON.stringify(openaiOptions)} and network options ${JSON.stringify(networkOptions)}`);
    const response = await openai.chat.completions.create(openaiOptions, networkOptions);
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => {
            response.controller.abort();
            throw new Error("Request aborted");
        });
    }

    if (openaiOptions.tools && response.choices[0].message.tool_calls) {
        try {
            return await OpenAI.parseTool(response, llmjs);
        } catch (e) {
            throw e;
            log("Auto tool parsing failed, trying JSON format");
        }
    }

    if (options.stream) {
        if (options.extended) {

            const stream = OpenAI.parseExtendedStream(response);

            let completed = false;

            const usage = {
                input_tokens: 0,
                output_tokens: 0,
            };

            async function* stream_response() {
                let buffer = "";
                for await (const chunk of stream) {
                    if (typeof chunk === "object" && chunk.usage) {
                        usage.input_tokens += chunk.usage.prompt_tokens;
                        usage.output_tokens += chunk.usage.completion_tokens;
                        const cost = LLM.costForModelTokens(service, options.model, usage.input_tokens, usage.output_tokens, llmjs.overrides);
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
                model: openaiOptions.model,
                service,
                options: openaiOptions,
                messages,
                stream: stream_response(),
                complete: async () => {
                    if (completed) throw new Error("Already completed");
                    completed = true;

                    const completion = {
                        ...extended,
                        messages: llmjs.messages,
                        usage,
                    }

                    delete completion.stream;
                    return completion;
                }

            };

            return extended;

        } else {
            return OpenAI.parseStream(response);
        }
    }

    const message = response.choices[0].message;
    if (!message) throw new Error(`Invalid message from ${service}`);

    const content = message.content.trim();
    if (isJSONFormat) {
        return parsers.json(content);
    }

    if (options.extended) {
        const input_tokens = response.usage.prompt_tokens;
        const output_tokens = response.usage.completion_tokens;
        const cost = LLM.costForModelTokens(service, options.model, input_tokens, output_tokens, llmjs.overrides);

        const extended_response = {
            options: openaiOptions,
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

        return extended_response;
    }

    return content;
}

OpenAI.parseJSONFormat = function (content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Expected JSON response, got ${content}`)
    }
}

OpenAI.parseStream = async function* (response) {
    for await (const chunk of response) {
        if (chunk.choices && chunk.choices[0].finish_reason) break;
        if (chunk.choices && chunk.choices[0].delta.tool_calls) {
            yield chunk.choices[0].delta.tool_calls[0].function.arguments;
        }
        if (chunk.choices && chunk.choices[0].delta.content) {
            yield chunk.choices[0].delta.content;
        }
    }
};

OpenAI.parseExtendedStream = async function* (response) {
    for await (const chunk of response) {
        const choice = chunk?.choices?.[0];
        if (choice) {
            const delta = choice.delta;
            if (delta.tool_calls) {
                yield delta.tool_calls[0].function.arguments;
            }

            if (delta.content) {
                yield delta.content;
            }
        }
        
        if (chunk.usage) {
            yield { usage: chunk.usage };
            break;
        }
    }
};

OpenAI.parseTool = async function (response, llmjs) {

    const responses = [];

    if (!response) throw new Error(`Invalid response`);
    if (!response.choices || response.choices === 0) throw new Error(`Invalid choices`);

    const message = response.choices[0].message;
    if (!message) throw new Error(`Invalid message`);

    llmjs.messages.push(message);

    if (!message.tool_calls) throw new Error(`Invalid tool calls`);
    for (const tool of message.tool_calls) {

        if (!tool.function) throw new Error(`Invalid function`);
        if (!tool.function.arguments) throw new Error(`Expected function call response`);
        responses.push(tool);
    }

    if (responses.length === 0) throw new Error(`No valid responses`);
    if (responses.length === 1) return responses[0];
    return responses;
}

OpenAI.defaultModel = MODEL;