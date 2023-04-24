const log = require("debug")("llm.js:index");

const services = require("./services");
const { parseJSONFromText } = require("./parsers");

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

    this.service = options.service || process.env.LLM_SERVICE || "openai";
    this.model = options.model || process.env.LLM_MODEL || "gpt-3.5-turbo";
    this.parser = options.parser || null;
    this.stream = !!options.stream;
    this.context = options.context || LLM.CONTEXT_FULL;
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
    const service = services[this.service];
    if (!service) throw new Error(`LLM.js is using "${this.service}" but it is not enabled. Please set the ${this.service.toLocaleUpperCase()}_API_KEY environment variable.`);

    if (!options) options = {};
    options.stream = !!options.stream;
    if (!options.model) options.model = this.model;
    if (!options.stream && this.stream) options.stream = this.stream;
    if (!options.parser && this.parser) options.parser = this.parser;
    if (!options.context) options.context = this.context;

    let messages;
    if (options.context == LLM.CONTEXT_FIRST) {
        messages = this.messages.slice(0, 1);
    } else if (options.context == LLM.CONTEXT_LAST) {
        messages = this.messages.slice(-1);
    } else if (options.context == LLM.CONTEXT_OUTSIDE) {
        messages = [this.messages[0], this.messages[this.messages.length - 1]];
    } else {
        messages = this.messages;
    }

    if (options.stream) {
        options.streamCallback = (content) => {
            this.assistant(content);
        };
    }

    log(`fetching ${this.service} completion with ${messages.length} messages (stream=${options.stream})`)
    const completion = await service(messages, options);

    if (options.stream) {
        return completion;
    } else {
        this.assistant(completion);
        return completion;
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

LLM.parseJSONFromText = parseJSONFromText;

module.exports = LLM;