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
    this.parser = options.parser || null;
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


LLM.prototype.chat = async function (content, options = null) {
    this.user(content);
    return await this.fetch(options);
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
    let parser = options.parser || this.parser || null;

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
        if (!parser) parser = parseStream;
        return parser(completion, (content) => {
            this.assistant(content);
        });
    } else {
        let content = completion.data.choices[0].message.content.trim();
        if (parser) content = parser(content);
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

// YOLO CODE: https://themaximalist.com/infinityarcade/
function parseJSONFromText(blob) {
    try {
        return JSON.parse(blob);
    } catch (e) {
        // noop
    }

    const lines = blob.split("\n");
    for (const line of lines) {
        if (line[0] == "{") {
            try {
                return JSON.parse(line);
            } catch (e) {
                // noop
            }
        }
    }

    throw new Error(`Invalid response: '${blob}'`);
}

LLM.parseStream = parseStream;
LLM.parseJSONFromText = parseJSONFromText;

module.exports = LLM;