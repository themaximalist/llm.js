import { LLAMAFILE, OPENAI, ANTHROPIC, MISTRAL, GOOGLE, OLLAMA, PERPLEXITY, GROK } from "./services.js";
import SchemaConverter from "../lib/jsonschema-to-gbnf.js";

export function serviceForModel(model) {
    model = model.toLowerCase();

    if (typeof model !== "string") { return null }

    if (model.indexOf("llamafile") === 0) {
        return LLAMAFILE;
    } else if (model.indexOf("gpt-") === 0 || model.indexOf("o1-") === 0) {
        return OPENAI;
    } else if (model.indexOf("claude-") === 0) {
        return ANTHROPIC;
    } else if (model.indexOf("gemini") === 0) {
        return GOOGLE;
    } else if (model.indexOf("mistral") === 0) {
        return MISTRAL;
    } else if (model.indexOf("-sonar-") !== -1 && model.indexOf("-online") !== -1) {
        return PERPLEXITY;
    } else if (model.indexOf("llama2") === 0) {
        return OLLAMA;
    } else if (model.indexOf("deepseek") === 0) {
        return DEEPSEEK;
    } else if (model.indexOf("grok") === 0) {
        return GROK;
    }

    return null;
}

export function jsonSchemaToBFNS(schema) {
    const converter = new SchemaConverter();
    converter.visit(schema, "");
    return converter.formatGrammar();
}

export async function* stream_response(response) {
    for await (const chunk of response.body) {

        let data = chunk.toString("utf-8");

        if (!data.includes("data: ")) { continue; }

        const lines = data.split("\n");
        for (let line of lines) {
            // remove data: if it exists
            if (!line.indexOf("data: ")) { line = line.slice(6); }
            line = line.trim();

            if (line.length == 0) continue;

            const obj = JSON.parse(line);
            yield obj.content;
        }
    }
}

export async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
