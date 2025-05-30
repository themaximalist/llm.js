import debug from "debug";
const log = debug("llm.js");

import LlamaFile from "./llamafile.js";
import OpenAI from "./openai.js";
import Anthropic from "./anthropic.js";
import Mistral from "./mistral.js";
import Google from "./google.js";
import Ollama from "./ollama.js";
import Groq from "./groq.js";
import Together from "./together.js";
import Perplexity from "./perplexity.js";
import DeepSeek from "./deepseek.js";
import xAI from "./xai.js";
import { LLAMAFILE, OPENAI, ANTHROPIC, MISTRAL, GOOGLE, OLLAMA, GROQ, TOGETHER, PERPLEXITY, DEEPSEEK, XAI} from "./services.js";

import { serviceForModel } from "./utils.js";
import * as parsers from "./parsers.js";

import { EventEmitter } from "eventemitter3";

import MODELS_PRICES from "../data/model_prices_and_context_window.json" assert { type: "json" };

import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

export default function LLM(input, options = {}) {

    // function call
    if (!(this instanceof LLM)) {
        return new Promise(async (resolve, reject) => {
            const llm = new LLM(input, options);
            try {
                resolve(await llm.send());
            } catch (e) {
                reject(e);
            }
        });
    }

    // object call
    if (typeof input === "string" && input.length > 0) {
        this.messages = [{ role: "user", content: input }];
    } else if (Array.isArray(input)) {
        this.messages = input;
    } else {
        this.messages = [];
    }

    if (options.overrides) {
        this.overrides = options.overrides;
        delete options.overrides;
    } else {
        this.overrides = {};
    }

    this.options = options;
}

LLM.prototype.send = async function (opts = {}) {
    const options = Object.assign({}, this.options, opts);

    if (!options.model && !options.service) {
        options.model = LLAMAFILE;
        options.service = LLM.LLAMAFILE;
    } else if (!options.model && options.service) {
        options.model = LLM.modelForService(options.service);
    } else if (options.model && !options.service) {
        options.service = serviceForModel(options.model);
    }

    const isExtendedResponse = !!options.extended;

    if (!options.model) { throw new Error("No model provided") }
    if (!options.service) { throw new Error("No service provided") }

    if (typeof options.max_tokens === "string") { options.max_tokens = parseInt(options.max_tokens) }
    if (typeof options.temperature === "string") { options.temperature = parseFloat(options.temperature) }
    if (typeof options.seed === "string") { options.seed = parseInt(options.seed) }
    if (typeof options.stream === "string") { options.stream = JSON.parse(options.stream) }
    if (Array.isArray(options.tools)) { options.tools = options.tools }

    log(`send() model=${options.model} service=${options.service}`);

    // add an event emitter to the options so we can send events like 'abort' to the service
    this.eventEmitter = new EventEmitter();
    options.eventEmitter = this.eventEmitter;

    let response;
    switch (options.service) {
        case LLAMAFILE:
            response = await LlamaFile(this.messages, options, this);
            break;
        case OPENAI:
            response = await OpenAI(this.messages, options, this);
            break;
        case ANTHROPIC:
            response = await Anthropic(this.messages, options, this);
            break;
        case MISTRAL:
            response = await Mistral(this.messages, options, this);
            break;
        case GOOGLE:
            response = await Google(this.messages, options, this);
            break;
        case OLLAMA:
            response = await Ollama(this.messages, options, this);
            break;
        case GROQ:
            response = await Groq(this.messages, options, this);
            break;
        case TOGETHER:
            response = await Together(this.messages, options, this);
            break;
        case PERPLEXITY:
            response = await Perplexity(this.messages, options, this);
            break;
        case DEEPSEEK:
            response = await DeepSeek(this.messages, options, this);
            break;
        case XAI:
            response = await xAI(this.messages, options, this);
            break;
        default:
            throw new Error(`Unknown service ${options.service}`);
    }

    if (options.stream) {
        if (options.stream_handler) {
            response = await this.handleStream(response, options.stream_handler);
        } else {
            if (isExtendedResponse) {
                return response;
            } else {
                return this.streamResponse(response);
            }
        }
    }

    if (response && !options.tools) {
        if (isExtendedResponse) {
            this.assistant(response.response);
        } else {
            this.assistant(response);
        }
    }

    if (options.parser) {
        if (options.parser.constructor.name === "AsyncFunction") {
            if (isExtendedResponse) {
                return await options.parser(response.response);
            } else {
                return await options.parser(response);
            }
        }

        if (isExtendedResponse) {
            return options.parser(response.response);
        } else {
            return options.parser(response);
        }
    }

    return response;
}

LLM.prototype.handleStream = async function (response, handler) {
    let buffer = "";
    for await (const chunk of response) {
        buffer += chunk;
        handler(chunk);
    }

    return buffer;
}

LLM.prototype.streamResponse = async function* (response) {
    let buffer = "";
    for await (const chunk of response) {
        buffer += chunk;
        yield chunk;
    }


    if (buffer) this.assistant(buffer);
}

// get service()
Object.defineProperty(LLM.prototype, "service", {
    get: function () {
        const service = this.options.service;
        if (service) return service;

        if (!this.options.model) {
            throw new Error("No model provided");
        }

        return serviceForModel(this.options.model);
    }
});

// get model()
Object.defineProperty(LLM.prototype, "model", {
    get: function () {
        const model = this.options.model;
        if (model) return model;

        const service = this.service;
        if (!service) {
            throw new Error("No service provided");
        }

        return LLM.modelForService(service);
    }
});

LLM.prototype.abort = function () {
    this.eventEmitter.emit('abort');
}

LLM.prototype.chat = async function (content, options = null) {
    this.user(content);
    const opts = Object.assign({}, this.options, options);
    return await this.send(opts);
}

LLM.prototype.user = function (content) {
    this.history("user", content);
}

LLM.prototype.system = function (content) {
    this.history("system", content);
}

LLM.prototype.assistant = function (content) {
    this.history("assistant", content);
}

LLM.prototype.history = function (role, content) {
    if (!content) throw new Error("No content provided");
    if (typeof content !== "string") { content = JSON.stringify(content) }
    this.messages.push({ role, content });
}

LLM.prototype.estimateCost = function (input_tokens, output_tokens) {
    return LLM.costForModelTokens(this.service, this.model, input_tokens, output_tokens, this.overrides);
}

LLM.costForModelTokens = function (service, model_name, input_tokens, output_tokens, overrides = {}, local = false) {
    if (local) {
        log(`Using local cost ($0.00) for ${service}/${model_name}`);
        return { input_cost: 0, output_cost: 0, cost: 0 };
    }

    const modelPrices = Object.assign({}, MODELS_PRICES, overrides);
    let model = modelPrices[model_name];
    if (!model) {
        model = modelPrices[`${service}/${model_name}`];
        if (!model) {
            if (service === "google") {
                return LLM.costForModelTokens("gemini", model_name, input_tokens, output_tokens, overrides);
            }
            log(`Unknown service ${service} and model ${model_name} for cost calculation`);
            return { input_cost: NaN, output_cost: NaN, cost: NaN };
        }
    }

    if (typeof model === "string") {
        model = modelPrices[model];
        if (!model) {
            if (service === "google") {
                return LLM.costForModelTokens("gemini", model_name, input_tokens, output_tokens, overrides);
            }
            log(`Unknown model ${model} for cost calculation`);
            return { input_cost: NaN, output_cost: NaN, cost: NaN };
        }
    }

    const input_cost = model.input_cost_per_token * input_tokens;
    const output_cost = model.output_cost_per_token * output_tokens;

    const cost = input_cost + output_cost;
    return { input_cost, output_cost, cost };
}

LLM.serviceForModel = function (model) {
    return serviceForModel(model);
}

LLM.llmForService = function (service) {
    if (service === LLAMAFILE) {
        return LlamaFile;
    } else if (service === OPENAI) {
        return OpenAI;
    } else if (service === ANTHROPIC) {
        return Anthropic;
    } else if (service === MISTRAL) {
        return Mistral;
    } else if (service === GOOGLE) {
        return Google;
    } else if (service === OLLAMA) {
        return Ollama;
    } else if (service === GROQ) {
        return Groq;
    } else if (service === TOGETHER) {
        return Together;
    } else if (service === PERPLEXITY) {
        return Perplexity;
    } else if (service === DEEPSEEK) {
        return DeepSeek;
    } else if (service === XAI) {
        return xAI;
    }

    return null;
}

LLM.isLocalService = function (service) {
    const llm = LLM.llmForService(service);
    if (!llm) {
        throw new Error(`Unknown service ${service}`);
    }

    return !!llm.isLocal;
}

LLM.modelForService = function (service) {
    const llm = LLM.llmForService(service);
    if (!llm) {
        throw new Error(`Unknown service ${service}`);
    }

    return llm.defaultModel;
}

LLM.prototype.estimateTokens = function (encoding = "cl100k_base") {
    let buffers = [];
    for (const message of this.messages) {
        if (message.content && typeof message.content === "string") {
            buffers.push(message.content);
        }
    }

    return LLM.estimateTokens(buffers.join("\n"), encoding);
}

LLM.estimateTokens = function (prompt) {
    const enc = new Tiktoken(o200k_base);
    return enc.encode(prompt).length;
}

LLM.getLatestModels = async function (service, options = {}) {
    const llm = LLM.llmForService(service);
    if (!llm) {
        throw new Error(`Unknown service ${service}`);
    }

    return await llm.getLatestModels(options);
}

LLM.testConnection = async function (service, options = {}) {
    const llm = LLM.llmForService(service);
    if (!llm) {
        throw new Error(`Unknown service ${service}`);
    }

    return await llm.testConnection(options);
}

LLM.LLAMAFILE = LLAMAFILE;
LLM.OPENAI = OPENAI;
LLM.ANTHROPIC = ANTHROPIC;
LLM.MISTRAL = MISTRAL;
LLM.GOOGLE = GOOGLE;
LLM.OLLAMA = OLLAMA;
LLM.GROQ = GROQ;
LLM.TOGETHER = TOGETHER;
LLM.PERPLEXITY = PERPLEXITY;
LLM.DEEPSEEK = DEEPSEEK;
LLM.SERVICES = [LLAMAFILE, OPENAI, ANTHROPIC, MISTRAL, GOOGLE, OLLAMA, GROQ, TOGETHER, PERPLEXITY, DEEPSEEK, XAI];

LLM.MODELS_PRICES = MODELS_PRICES;

LLM.parsers = parsers;
