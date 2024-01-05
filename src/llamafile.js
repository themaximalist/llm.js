import fetch from "node-fetch";

const ENDPOINT = "http://127.0.0.1:8080/completion";
const MODEL = "LLaMA_CPP";

const USER_PROMPT = "### User:";
const ASSISTANT_PROMPT = "### Assistant:";

function format_prompt(messages) {
    const prompt = messages.map(message => {
        if (message.role === "system") {
            return message.content;
        } else if (message.role === "user") {
            return `${USER_PROMPT}${message.content}`;
        } else {
            return `${ASSISTANT_PROMPT}${message.content}`;
        }
    });

    prompt.push(ASSISTANT_PROMPT);

    return prompt.join("\n");
}

async function* stream_response(response) {
    for await (const chunk of response.body) {
        let data = chunk.toString("utf-8");
        if (!data.includes("data: ")) { continue; }

        const lines = data.slice("data: ".length).trim().split("\n");
        for (const line of lines) {
            const obj = JSON.parse(line);
            yield obj.content;
        }
    }
}

export default async function LlamaFile(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

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
}
