import LLM from "./LLM.js";
import type { LLMOptions } from "./LLM.js";
import Anthropic from "./anthropic.js";
import Ollama from "./ollama.js";

export type LLMServices = Anthropic | Ollama;

interface LLMConstructor {
    new (input: string, options?: LLMOptions): LLM;
    (input: string, options?: LLMOptions): Promise<string>;
}
const LLMShortHand = function(input: string, options?: LLMOptions): Promise<string> | LLMServices {
    let llm;

    if (options?.service === "anthropic") {
        llm = new Anthropic(input, options);
    } else {
        llm = new Ollama(input, options);
    }

    if (new.target) {
        return llm;
    }

    return llm.send();
} as LLMConstructor;

export default LLMShortHand;
export { Anthropic, Ollama };