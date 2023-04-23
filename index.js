const log = require("debug")("llm.js:index");

const { openai } = require("./apis.js");

function LLM(input, options = null) {
    if (!options) options = {};

    if (!(this instanceof LLM)) { // function call
        return new Promise(async (resolve, reject) => {
            const llm = new LLM(input, options);
            resolve(await llm.fetch());
        });
    }

    let messages;
    if (typeof input === "string") {
        messages = [{ role: "user", content: input }];
    } else if (Array.isArray(input)) {
        messages = input;
    } else if (input === null || input === undefined) {
        messages = [];
    } else {
        throw new Error("Invalid input");
    }

    this.model = options.model || process.env.LLM_MODEL || "gpt-3.5-turbo";
    this.stream = !!options.stream;
    this.messages = messages;

    this.__defineGetter__("lastMessage", () => {
        return this.messages[this.messages.length - 1];
    });

    return this;
}

LLM.CONTEXT_FIRST = "LLM_CONTEXT_FIRST";
LLM.CONTEXT_LAST = "LLM_CONTEXT_LAST";
LLM.CONTEXT_OUTSIDE = "LLM_CONTEXT_OUTSIDE"; // first and last
LLM.CONTEXT_FULL = "LLM_CONTEXT_FULL";


LLM.prototype.chat = async function (content) {
    this.user(content);
    return await this.fetch();
}

LLM.prototype.user = function (content) {
    this.messages.push({ role: "user", content });
}

LLM.prototype.system = function (content) {
    this.messages.push({ role: "system", content });
}

LLM.prototype.assistant = function (content) {
    this.messages.push({ role: "assistant", content });
}

LLM.prototype.fetch = async function (options = null) {
    let messages;
    if (!options) options = {};
    const streamParser = options.streamParser || parseStream;

    if (options.context == LLM.CONTEXT_FIRST) {
        messages = this.messages.slice(0, 1);
    } else if (options.context == LLM.CONTEXT_LAST) {
        messages = this.messages.slice(-1);
    } else if (options.context == LLM.CONTEXT_OUTSIDE) {
        messages = [this.messages[0], this.messages[this.messages.length - 1]];
    } else {
        messages = this.messages;
    }

    let networkOptions = {};
    if (this.stream) networkOptions.responseType = "stream";

    const completion = await openai.createChatCompletion({
        messages,
        model: this.model,
        stream: this.stream,
    }, networkOptions);

    if (this.stream) {
        return streamParser(completion, (content) => {
            this.assistant(content);
        });
    } else {
        const content = completion.data.choices[0].message.content.trim();
        this.assistant(content);
        return content;
    }
}

LLM.system = async function (prompt, input, options = null) {
    const llm = new LLM(null, options);
    llm.system(prompt);
    llm.user(input);
    return await llm.fetch();
}

LLM.user = async function (prompt, input, options = null) {
    const llm = new LLM(null, options);
    llm.user(prompt);
    llm.user(input);
    return await llm.fetch();
}

async function* parseStream(response, callback = null) {
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
                return;
            }

            const json = JSON.parse(message);
            const token = json.choices[0].delta.content;
            if (!token) continue;

            content += token;
            yield token;
        }
    }
}

module.exports = LLM;