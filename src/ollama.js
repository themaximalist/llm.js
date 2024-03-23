import debug from "debug";
import { Ollama as OllamaClient } from 'ollama';

const log = debug("llm.js:ollama");

const ENDPOINT = ""; // defaults to http://127.0.0.1:11434
const MODEL = "llama2:7b";

const OllamaOptions = [
    "numa",
    "num_ctx",
    "num_batch",
    "main_gpu",
    "low_vram",
    "f16_kv",
    "logits_all",
    "vocab_only",
    "use_mmap",
    "use_mlock",
    "embedding_only",
    "num_thread",
    "num_keep",
    "seed",
    "num_predict",
    "top_k",
    "top_p",
    "tfs_z",
    "typical_p",
    "repeat_last_n",
    "temperature",
    "repeat_penalty",
    "presence_penalty",
    "frequency_penalty",
    "mirostat",
    "mirostat_tau",
    "mirostat_eta",
    "penalize_newline",
    "stop"
];

export default async function Ollama(messages, options = {}) {
    if (!messages || messages.length === 0) { throw new Error("No messages provided") }

    const model = options.model || MODEL;
    const endpoint = options.endpoint || ENDPOINT;

    const ollama = new OllamaClient({ host: endpoint });
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => ollama.abort());
    }
    let ollamaOptions = {};
    for (const key of OllamaOptions) {
        if (typeof options[key] !== "undefined") {
            ollamaOptions[key] = options[key];
        }
    }

    if (options.max_tokens !== undefined) {
        ollamaOptions.num_predict = options.max_tokens;
    }

    let format;
    if (options.schema !== undefined) {
        format = "json";
    }

    let requestOptions = {
        model,
        messages,
        stream: options.stream,
        format,
        options: ollamaOptions,
        template: options.template,
        keep_alive: options.keep_alive,
    };

    log(`sending to Ollama ${endpoint} with body ${JSON.stringify(requestOptions)}`);

    const response = await ollama.chat(requestOptions);

    if (options.stream) {
        return stream_response(response);
    } else {
        return response.message.content;
    }
}

Ollama.defaultModel = MODEL;

export async function* stream_response(response) {
    for await (const chunk of response) {
        yield chunk.message.content;
    }
}
