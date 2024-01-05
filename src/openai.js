import { OpenAI as OpenAIClient } from "openai";

let openai = null;
const MODEL = "gpt-4-1106-preview";

export default async function OpenAI(messages, options = {}) {
    if (!openai) { openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY }); }
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

    let networkOptions = {};
    if (options.stream) networkOptions.responseType = "stream";

    const openaiOptions = {
        model: options.model,
        stream: options.stream,
    };

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

    openaiOptions.messages = messages;
    const response = await openai.chat.completions.create(openaiOptions, networkOptions);

    if (options.stream) {
        return OpenAI.parseStream(response);
    } else {
        const content = response.choices[0].message.content.trim();
        return content;
    }
}

OpenAI.parseStream = async function* (response) {

    for await (const chunk of response) {
        if (chunk.choices[0].finish_reason) break;
        yield chunk.choices[0].delta.content;
    }
};

