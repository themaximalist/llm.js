const log = require("debug")("llm.js:index");

const getAPI = require("./openai").get;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "gpt-3.5-turbo";

class Chat {
    constructor(model = LLM_MODEL, api_key = OPENAI_API_KEY) {
        this.model = model;
        this.api_key = api_key;
        this.messages = [];
    }

    user(content) {
        this.messages.push({ role: "user", content });
    }

    assistant(content) {
        this.messages.push({ role: "assistant", content });
    }

    system(content) {
        this.messages.push({ role: "system", content });
    }

    async chat(content) {
        this.user(content);
        return await this.send();
    }

    async send() {
        try {
            const response = await Completion(this.messages, this.model, this.api_key);
            this.assistant(response);
            return response;
        } catch (e) {
            log(`error sending chat: ${e}`);
        }
    }

    static fromSystemPrompt(prompt, model = LLM_MODEL, api_key = OPENAI_API_KEY) {
        const chat = new Chat(model, api_key);
        chat.system(prompt);
        return chat;
    }
}

async function Agent(prompt, input, model = LLM_MODEL, api_key = OPENAI_API_KEY) {
    const messages = [
        { role: "system", content: prompt },
        { role: "user", content: input }
    ];
    return await Completion(messages, model, api_key);
}

async function AI(input, model = LLM_MODEL, api_key = OPENAI_API_KEY) {
    return await Completion([{ "role": "user", "content": input }], model, api_key);
}

async function Completion(messages, model = LLM_MODEL, api_key = OPENAI_API_KEY) {
    log(`Generating completion response for ${JSON.stringify(messages)} message (model: ${model})`);

    try {
        if (!api_key) throw new Error(`No API key provided for ${model}`);

        const openai = getAPI(api_key);
        const completion = await openai.createChatCompletion({
            model,
            messages,
        });

        return completion.data.choices[0].message.content.trim();
    } catch (error) {
        log(`Error generating AI response: ${error}`);
        return null;
    }
}

async function* StreamCompletion(messages, parser = null, model = LLM_MODEL, api_key = OPENAI_API_KEY) {
    log(`StreamCompletion response for ${messages.length} message (model: ${model})`);

    if (!parser) parser = parseStream;

    try {
        if (!api_key) throw new Error(`No API key provided for ${model}`);

        const openai = getAPI(api_key);
        const response = await openai.createChatCompletion(
            {
                model,
                messages,
                stream: true,
            },
            { responseType: "stream" }
        );

        for await (const message of parser(response)) {
            yield message;
        }
    } catch (e) {
        log(`Error streaming AI response: ${e}`);
        return;
    }
}

async function* parseStream(response) {
    for await (const chunk of response.data) {
        const lines = chunk
            .toString("utf8")
            .split("\n")
            .filter((line) => line.trim().startsWith("data: "));

        for (const line of lines) {
            const message = line.replace(/^data: /, "");
            if (message === "[DONE]") {
                return;
            }

            const json = JSON.parse(message);
            const token = json.choices[0].delta.content;
            if (!token) continue;

            yield token;
        }
    }
}
module.exports = {
    Agent,
    AI,
    Completion,
    StreamCompletion,
    Chat,
};
