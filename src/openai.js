import debug from "debug";
const log = debug("llm.js:modeldeployer");

import { OpenAI as OpenAIClient } from "openai";

let openai = null;
const MODEL = "gpt-4-1106-preview";

export default async function OpenAI(messages, options = {}) {
    if (!openai) { openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY }); }
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

    const isFunctionCall = typeof options.schema === "object";
    if (isFunctionCall) {
        openaiOptions.functions = [{
            name: "extract_schema",
            parameters: options.schema
        }];
        openaiOptions.function_call = { name: "extract_schema" };
    }


    openaiOptions.messages = messages;

    log(`sending with options ${JSON.stringify(openaiOptions)} and network options ${JSON.stringify(networkOptions)}`);
    const response = await openai.chat.completions.create(openaiOptions, networkOptions);

    if (options.stream) {
        return OpenAI.parseStream(response);
    }

    if (isFunctionCall) {
        return OpenAI.parseExtractSchema(response);
    }

    return response.choices[0].message.content.trim();
}

OpenAI.parseStream = async function* (response) {
    for await (const chunk of response) {
        if (chunk.choices[0].finish_reason) break;
        yield chunk.choices[0].delta.content;
    }
};

OpenAI.parseExtractSchema = async function (response) {
    const message = response.choices[0].message;
    if (!message.function_call) throw new Error(`Expected function call response from OpenAI, got ${JSON.stringify(message)}`);
    if (message.function_call.name !== "extract_schema") throw new Error(`Expected 'extract_schema' function call response from OpenAI}`);
    if (!message.function_call.arguments) throw new Error(`Expected function call response from OpenAI`);

    const args = response.choices[0].message.function_call.arguments;
    try {
        return JSON.parse(args);
    } catch (e) {
        throw new Error(`Expected function call response from OpenAI for 'extract_schema' to have valid JSON arguments, got ${args}`)
    }
}