import debug from "debug";
const log = debug("llm.js:anthropic");

import { Anthropic as Client } from "@anthropic-ai/sdk";

const MODEL = "claude-2.1";

const HUMAN_PROMPT = "\n\nHuman:";
const ASSISTANT_PROMPT = "\n\nAssistant:";

export default async function Anthropic(messages, options = {}) {
    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        apiKey = process.env.ANTHROPIC_API_KEY;
    }

    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No Anthropic API key provided") }

    const anthropic = new Client({ apiKey });
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

    const isFunctionCall = typeof options.schema !== "undefined";
    if (isFunctionCall) {
        throw new Error(`Anthropic does not support function calls`);
    }

    const prompt = toAnthropic(messages);

    const anthropicOptions = {
        prompt,
        stop_sequences: [HUMAN_PROMPT],
        model: options.model,
        max_tokens_to_sample: 4096,
    };

    if (typeof options.temperature !== "undefined") {
        anthropicOptions.temperature = options.temperature;
        if (anthropicOptions.temperature < 0) anthropicOptions.temperature = 0;
        if (anthropicOptions.temperature > 1) anthropicOptions.temperature = 1;
    }

    if (typeof options.max_tokens !== "undefined") {
        anthropicOptions.max_tokens_to_sample = options.max_tokens;
    }

    if (options.stream) {
        anthropicOptions.stream = options.stream;
    }

    log(`sending with options ${JSON.stringify(anthropicOptions)}`);

    const response = await anthropic.completions.create(anthropicOptions);
    if (!response || response.exception) throw new Error("invalid completion from anthropic");

    if (options.stream) {
        return Anthropic.parseStream(response);
    } else {
        return response.completion.trim();
    }
}

function toAnthropicRole(role) {
    switch (role) {
        case "user":
            return HUMAN_PROMPT;
        case "assistant":
        case "system":
            return ASSISTANT_PROMPT;
        default:
            throw new Error(`unknown anthropic role ${role}`);
    }
}
function toAnthropic(messages) {

    let system_prompt = "";
    if (messages.length > 1 && messages[0].role == "system") {
        system_prompt = `${messages.shift().content}\n\n`;
    }

    const conversation = messages.map((message) => {
        return `${toAnthropicRole(message.role)} ${message.content}`;
    });

    const conversationStr = conversation.join("");
    return `${system_prompt}${conversationStr}${ASSISTANT_PROMPT}`;
}


Anthropic.parseStream = async function* (response) {
    for await (const chunk of response) {
        if (chunk.stop_reason) break;
        yield chunk.completion;
    }
};

Anthropic.defaultModel = MODEL;