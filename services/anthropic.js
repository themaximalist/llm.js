// re-create these here because we don't want to import the library unless the user wants to use anthropic
const HUMAN_PROMPT = "\n\nHuman:";
const AI_PROMPT = "\n\nAssistant:";

function createAPI() {
    const { Client } = require("@anthropic-ai/sdk");
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
    return new Client(process.env.ANTHROPIC_API_KEY);
}

function toAnthropicRole(role) {
    switch (role) {
        case "user":
            return HUMAN_PROMPT;
        case "assistant":
        case "system":
            return AI_PROMPT;
        default:
            throw new Error(`unknown anthropic role ${role}`);
    }
}
function toAnthropic(input) {
    if (typeof input == "string") {
        return `${HUMAN_PROMPT} ${input}${AI_PROMPT}`;
    } else if (Array.isArray(input)) {
        const conversation = input.map((message) => {
            return `${toAnthropicRole(message.role)} ${message.content}`;
        });

        return `${conversation.join("")}${AI_PROMPT}`
    }

    throw new Error(`unknown anthropic message format, must be string|array`)
}

let anthropic = null;
async function completion(messages, options = {}) {
    if (!anthropic) anthropic = createAPI();
    if (!options) options = {};
    if (!options.model) options.model = "claude-v1";
    if (!Array.isArray(messages)) throw new Error(`claude.completion() expected array of messages`);

    const prompt = toAnthropic(messages);
    const anthropicOptions = {
        prompt,
        stop_sequences: [HUMAN_PROMPT],
        max_tokens_to_sample: 2000,
        model: "claude-v1",
    };

    if (options.stream) {
        const response = await anthropic.completeStream(anthropicOptions, {
            onOpen: (response) => {
                // console.log("ON OPEN", response);
            },
            onUpdate: (data) => {
                console.log("ON DATA", data);
            }
        });
        console.log("DONE");
        console.log(response);
    } else {
        const response = await anthropic.complete(anthropicOptions);
        if (!response || response.exception) throw new Error("invalid completion from anthropic");
        return response.completion.trim();
    }

    /*
    let networkOptions = {};
    if (options.stream) networkOptions.responseType = "stream";

    const response = await openai.createChatCompletion({
        messages,
        model: options.model,
        stream: !!options.stream,
    }, networkOptions);

    if (options.stream) {
        return response;
    } else {
        return response.data.choices[0].message.content.trim();
    }
    */
}

module.exports = completion;