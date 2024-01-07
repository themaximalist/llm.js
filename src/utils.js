import { LLAMAFILE, OPENAI, ANTHROPIC, MODELDEPLOYER } from "./services.js";

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