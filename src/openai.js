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
        return OpenAI.parseStream(response, options.streamCallback);
    } else {
        console.log(response);
        console.log(response.data);
        const content = response.choices[0].message.content.trim();
        return content;
    }



    /*
    const body = {
        model: options.model || MODEL,
        prompt: format_prompt(messages),
        stop: [`\n${USER_PROMPT}`],
    };

    if (typeof options.max_tokens === "number") { body.n_predict = options.max_tokens }
    if (typeof options.temperature === "number") { body.temperature = options.temperature }
    if (typeof options.seed === "number") { body.seed = options.seed }
    if (typeof options.schema === "string") { body.grammar = options.schema }
    if (typeof options.stream === "boolean") { body.stream = options.stream }

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer no-key" },
        body: JSON.stringify(body)
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    } else {
        const data = await response.json();

        if (options.schema) {
            return JSON.parse(data.content);
        } else {
            return data.content;
        }
    }
    */
}

OpenAI.parseStream = async function* (response, callback = null) {
    let content = "";
    for await (const chunk of response.data) {
        const lines = chunk
            .toString("utf8")
            .split("\n")
            .filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
            const message = line.replace(/^data: /, "");
            if (message === "[DONE]") {
                if (callback) {
                    callback(content);
                }
                return content;
            }

            const json = JSON.parse(message);
            let token;
            token = json.choices[0].delta.content;
            if (!token) continue;

            content += token;
            yield token;
        }
    }
};

