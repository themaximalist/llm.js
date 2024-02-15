import debug from "debug";
const log = debug("llm.js:google");

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/[MODEL]:[ACTION]?key=[APIKEY]";
const MODEL = "gemini-pro";

export default async function Google(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

    const model = options.model || MODEL;
    const apikey = options.apikey || process.env.GOOGLE_API_KEY;
    if (!apikey) { throw new Error("No Google API key provided") }

    const action = options.stream ? "streamGenerateContent" : "generateContent"

    const endpoint = ENDPOINT
        .replace("[MODEL]", model)
        .replace("[APIKEY]", apikey)
        .replace("[ACTION]", action);

    const body = {
        contents: toGoogle(messages),
        generationConfig: {},
    };


    if (typeof options.max_tokens === "number") { body.generationConfig.maxOutputTokens = options.max_tokens }
    if (typeof options.temperature === "number") { body.generationConfig.temperature = options.temperature }

    log(`sending to Google endpoint with body ${JSON.stringify(body)}`);

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        return stream_response(response);
    } else {
        const data = await response.json();
        console.log(data.candidates[0].content.parts[0].text);

        return data.candidates[0].content.parts[0].text;
    }
}


Google.defaultModel = MODEL;

export async function* stream_response(response) {
    const textDecoder = new TextDecoder();

    let buffer = "";
    for await (const chunk of response.body) {
        let data = textDecoder.decode(chunk);

        buffer += data;

        try {
            const obj = JSON.parse(buffer);
            buffer = "";
            yield obj[0].candidates[0].content.parts[0].text;
        } catch (e) {
            // no-op
        }
    }

    if (buffer.trim().length > 0) {
        throw new Error(`invalid JSON in stream: ${buffer}`);
    }
}

function toGoogleRole(role) {
    switch (role) {
        case "user":
        case "model":
            return role;
        case "assistant":
        case "system":
            return "model";
        default:
            throw new Error(`unknown Google role ${role}`);
    }
}
function toGoogle(messages) {
    return messages.map((message) => {
        return {
            role: toGoogleRole(message.role),
            parts: [{ text: message.content }]
        }
    });
}

