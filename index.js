const log = require("debug")("llm.js:index");

const { Configuration, OpenAIApi } = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY environment variable is required");

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

class ChatHistory {
    constructor() {
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
            const response = await Chat(this.messages);
            this.assistant(response);
            return response;
        } catch (e) {
            log(`error sending chat: ${e}`);
        }
    }
}

async function Agent(prompt, input, model = OPENAI_MODEL) {
    const messages = [
        { role: "system", content: prompt },
        { role: "user", content: input }
    ];
    return await Chat(messages, model);
}

async function AI(input, model = OPENAI_MODEL) {
    return await Chat([{ "role": "user", "content": input }], model);
}

async function Chat(messages, model = OPENAI_MODEL) {
    log(`Generating Chat response for ${JSON.stringify(messages)} message (model: ${model})`);

    try {
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

async function* StreamChat(messages, parser = null, model = OPENAI_MODEL) {
    log(`StreamChat response for ${messages.length} message (model: ${model})`);

    if (!parser) parser = parseStream;

    try {
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
    Chat,
    StreamChat,
    ChatHistory,
};
