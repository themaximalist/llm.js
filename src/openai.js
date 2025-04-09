import debug from "debug";
const log = debug("llm.js:openai");

import { OpenAI as OpenAIClient } from "openai";

const MODEL = "gpt-4o";

export default async function OpenAI(messages, options = {}, LLM = null) {

    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        apiKey = process.env.OPENAI_API_KEY;
    }

    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No OpenAI API key provided") }

    const dangerouslyAllowBrowser = options.dangerouslyAllowBrowser || false;
    const openai = new OpenAIClient({ apiKey, dangerouslyAllowBrowser });

    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

    const isO1 = options.model.indexOf("o1-") !== -1;

    let networkOptions = {};
    if (options.stream) networkOptions.responseType = "stream";

    const openaiOptions = { model: options.model };

    if (options.stream) {
        openaiOptions.stream = options.stream;
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
        openaiOptions.response_format = { "type": "json_object" };
    } else if (typeof options.response_format !== "undefined") {
        isJSONFormat = true; // currently openai only supports json response_format
        openaiOptions.response_format = options.response_format;
    }

    if (options.schema && options.tools) { throw new Error("Cannot specify both schema and tools") }
    if (options.schema) {
        openaiOptions.response_format = { "type": "json_object" };
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

    log(`sending with options ${JSON.stringify(openaiOptions)} and network options ${JSON.stringify(networkOptions)}`);
    const response = await openai.chat.completions.create(openaiOptions, networkOptions);
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => {
            response.controller.abort();
            throw new Error("Request aborted");
        });
    }

    if (openaiOptions.tools && response.choices[0].message.tool_calls) {
        try {
            return await OpenAI.parseTool(response, LLM);
        } catch (e) {
            throw e;
            log("Auto tool parsing failed, trying JSON format");
        }
    }

    if (options.stream) {
        return OpenAI.parseStream(response);
    }

    const message = response.choices[0].message;
    if (!message) throw new Error(`Invalid message from OpenAI`);

    const content = message.content.trim();
    if (isJSONFormat) {
        return OpenAI.parseJSONFormat(content);
    }

    if (options.extended) {
        console.log("extended", response);
        const input_tokens = response.usage.prompt_tokens;
        const output_tokens = response.usage.completion_tokens;
        const cost = LLM.costForModelTokens(options.model, input_tokens, output_tokens);

        return {
            options: openaiOptions,
            messages,
            response: content,
            usage: {
                input_tokens,
                output_tokens,
                cost,
            },
        }
    }

    return content;
}

OpenAI.parseJSONFormat = function (content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Expected JSON response from OpenAI, got ${content}`)
    }
}

OpenAI.parseStream = async function* (response) {
    for await (const chunk of response) {
        if (chunk.choices[0].finish_reason) break;
        if (chunk.choices[0].delta.tool_calls) {
            yield chunk.choices[0].delta.tool_calls[0].function.arguments;
        }
        if (chunk.choices[0].delta.content) {
            yield chunk.choices[0].delta.content;
        }
    }
};

OpenAI.parseTool = async function (response, LLM) {

    const responses = [];

    if (!response) throw new Error(`Invalid response from OpenAI`);
    if (!response.choices || response.choices === 0) throw new Error(`Invalid choices from OpenAI`);

    const message = response.choices[0].message;
    if (!message) throw new Error(`Invalid message from OpenAI`);

    LLM.messages.push(message);

    // console.log("PARSE TOOL", message);
    if (!message.tool_calls) throw new Error(`Invalid tool calls from OpenAI`);
    for (const tool of message.tool_calls) {

        if (!tool.function) throw new Error(`Invalid function from OpenAI`);
        if (!tool.function.arguments) throw new Error(`Expected function call response from OpenAI`);
        responses.push(tool);
        // const data = tool.function.arguments;
        // try {
        //     responses.push(JSON.parse(data));
        // } catch (e) {
        //     throw new Error(`Expected function call response from OpenAI for '${tool_name}' to have valid JSON arguments, got ${data}`)
        // }
    }

    if (responses.length === 0) throw new Error(`No valid responses from OpenAI`);
    if (responses.length === 1) return responses[0];
    return responses;
}

OpenAI.defaultModel = MODEL;