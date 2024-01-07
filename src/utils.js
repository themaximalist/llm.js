import { LLAMAFILE, OPENAI, ANTHROPIC, MODELDEPLOYER } from "./services.js";
import SchemaConverter from "../lib/jsonschema-to-gbnf.js";

export function serviceForModel(model) {
    if (model.indexOf("llamafile") === 0) {
        return LLAMAFILE;
    } else if (model.indexOf("gpt-") === 0) {
        return OPENAI;
    } else if (model.indexOf("claude-") === 0) {
        return ANTHROPIC;
    } else if (model.indexOf("modeldeployer") === 0) {
        return MODELDEPLOYER;
    }

    throw new Error(`Unknown model ${model}`);
}

export function convertJSONSchemaToBNFS(schema) {
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
