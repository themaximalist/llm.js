import debug from "debug";
const log = debug("llm.js:anthropic");

import fetch from "cross-fetch";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-5-sonnet-latest";

export default async function Anthropic(messages, options = {}, llmjs = null) {
    let apiKey = null;
    if (typeof options.apikey === "string") {
        apiKey = options.apikey
    } else {
        apiKey = process.env.ANTHROPIC_API_KEY;
    }

    if (!llmjs) {
        throw new Error("Anthropic requires llmjs");
    }

    // no fallback, either empty apikey string or env, not both
    if (!apiKey) { throw new Error("No Anthropic API key provided") }

    if (!messages || messages.length === 0) { throw new Error("No messages provided") }
    if (!options.model) { options.model = MODEL }

    const isFunctionCall = typeof options.schema !== "undefined";
    if (isFunctionCall) {
        throw new Error(`Anthropic does not support function calls`);
    }

    let system = null;
    if (messages.length > 1 && messages[0].role == "system") {
        system = messages.shift().content;
    }

    const anthropicOptions = {
        model: options.model,
        max_tokens: 4096,
    };

    if (system) {
        anthropicOptions.system = system;
    }

    if (typeof options.temperature !== "undefined") {
        anthropicOptions.temperature = options.temperature;
        if (anthropicOptions.temperature < 0) anthropicOptions.temperature = 0;
        if (anthropicOptions.temperature > 1) anthropicOptions.temperature = 1;
    }

    if (typeof options.max_tokens !== "undefined") {
        anthropicOptions.max_tokens = options.max_tokens;
    }

    if (options.stream) {
        anthropicOptions.stream = options.stream;
    }

    const fullOptions = { ...anthropicOptions, messages };

    log(`sending with options ${JSON.stringify(fullOptions)}`);

    const signal = new AbortController();
    if (options.eventEmitter) {
        options.eventEmitter.on('abort', () => signal.abort());
    }

    const response = await fetch(options.endpoint || ENDPOINT, {
        method: "POST",
        headers: {
            "anthropic-version": options.anthropicVersion || "2023-06-01",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify(fullOptions),
        signal: signal.signal,
    });

    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

    if (options.stream) {
        const stream = Anthropic.parseStream(response.body);
        return stream;
        if (options.extended) {
            console.log("extended stream");
            return { boom: "town"};
            // return {
            //     // options: anthropicOptions,
            //     // messages,
            //     get boom() {
            //         return "town";
            //     },
            //     boom: "town",
            //     [Symbol.asyncIterator]: () => stream,
            //     // usage: {
            //         // input_tokens: data.usage.input_tokens,
            //         // output_tokens: data.usage.output_tokens,
            //         // cost: llmjs.costForModelTokens(options.model, data.usage.input_tokens, data.usage.output_tokens),
            //     // },
            // }
        } else {
            console.log("regular stream");
            return stream;
        }
    }

    const data = await response.json();

    const content = data.content[0];
    const text = content.text;

    if (options.extended) {
        const input_tokens = data.usage.input_tokens;
        const output_tokens = data.usage.output_tokens;
        const cost = llmjs.costForModelTokens(options.model, input_tokens, output_tokens);

        return {
            options: anthropicOptions,
            messages,
            response: text,
            usage: {
                input_tokens,
                output_tokens,
                cost,
            },
        }
    }

    return text;
}

Anthropic.parseStream = async function* (response) {
    let buffer = '';
    
    for await (const chunk of response) {
        buffer += chunk.toString();

        console.log("buffer", buffer);
        
        // Split buffer into lines, keeping any incomplete line in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last partial line in buffer
        
        for (const line of lines) {
            if (!line || !line.startsWith('data:')) continue;
            
            try {
                const json = JSON.parse(line.substring(6));
                console.log("json", json);
                if (json.type !== "content_block_delta") continue;
                if (json.delta.type !== "text_delta") continue;
                yield json.delta.text;
            } catch (e) {
                // If JSON parsing fails, add back to buffer
                buffer = line + '\n' + buffer;
                continue;
            }
        }
    }
    
    // Process any remaining complete messages in buffer
    if (buffer) {
        const lines = buffer.split('\n');
        for (const line of lines) {
            if (!line || !line.startsWith('data:')) continue;
            
            try {
                const json = JSON.parse(line.substring(6));
                console.log("json", json);
                if (json.type !== "content_block_delta") continue;
                if (json.delta.type !== "text_delta") continue;
                yield json.delta.text;
            } catch (e) {
                // Ignore parsing errors in final buffer flush
                continue;
            }
        }
    }
};

Anthropic.defaultModel = MODEL;
