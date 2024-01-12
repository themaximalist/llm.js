import debug from "debug";
const log = debug("llm.js:modeldeployer");

import { OpenAI as OpenAIClient } from "openai";

const MODEL = "gpt-4-1106-preview";

export default async function OpenAI(messages, options = {}) {
    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        apiKey = process.env.OPENAI_API_KEY;
    }

    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No OpenAI API key provided") }

    const openai = new OpenAIClient({ apiKey });

    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

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

    if (typeof options.max_tokens !== "undefined") {
        openaiOptions.max_tokens = options.max_tokens;
    }

    if (typeof options.seed !== "undefined") {
        openaiOptions.seed = options.seed;
    }

    let isJSONSchema = false;
    if (typeof options.response_format !== "undefined") {
        isJSONSchema = true; // currently openai only supports json response_format
        openaiOptions.response_format = options.response_format;
    }

    const isExtractSchema = typeof options.schema === "object";
    if (isExtractSchema) {
        openaiOptions.tools = [{
            type: "function",
            function: {
                name: "extract_schema",
                description: "Extracts the requested JSON schema",
                parameters: options.schema
            }
        }];

        openaiOptions.tool_choice = {
            "type": "function",
            "function": { "name": "extract_schema" }
        };
    }


    openaiOptions.messages = messages;

    log(`sending with options ${JSON.stringify(openaiOptions)} and network options ${JSON.stringify(networkOptions)}`);
    const response = await openai.chat.completions.create(openaiOptions, networkOptions);

    if (options.stream) {
        return OpenAI.parseStream(response);
    }

    if (isExtractSchema) {
        return OpenAI.parseExtractSchema(response);
    }

    const content = response.choices[0].message.content.trim();
    if (isJSONSchema) {
        return OpenAI.parseJSONSchema(content);
    }

    return content;
}

OpenAI.parseJSONSchema = function (content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        throw new Error(`Expected JSON response from OpenAI, got ${content}`)
    }
}

OpenAI.parseStream = async function* (response) {
    for await (const chunk of response) {
        if (chunk.choices[0].finish_reason) break;
        yield chunk.choices[0].delta.content;
    }
};

OpenAI.parseExtractSchema = async function (response) {
    if (!response) throw new Error(`Invalid response from OpenAI`);
    if (!response.choices || response.choices === 0) throw new Error(`Invalid choices from OpenAI`);

    const message = response.choices[0].message;
    if (!message) throw new Error(`Invalid message from OpenAI`);

    if (!message.tool_calls || message.tool_calls.length === 0) throw new Error(`Invalid tool calls from OpenAI`);
    const tool = message.tool_calls[0];
    if (!tool) throw new Error(`Invalid tool from OpenAI`);

    if (!tool.function) throw new Error(`Invalid function from OpenAI`);
    if (tool.function.name !== "extract_schema") throw new Error(`Expected 'extract_schema' function call response from OpenAI`);
    if (!tool.function.arguments) throw new Error(`Expected function call response from OpenAI`);

    const data = tool.function.arguments;
    try {
        return JSON.parse(data);
    } catch (e) {
        throw new Error(`Expected function call response from OpenAI for 'extract_schema' to have valid JSON arguments, got ${data}`)
    }
}

OpenAI.defaultModel = MODEL;