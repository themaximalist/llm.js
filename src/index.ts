import type { Options } from "./LLM.js";
import Anthropic from "./anthropic.js";
import Ollama from "./ollama.js";
import type { Input, Message, ServiceName } from "./LLM.js";
import config from "./config.js";

export type LLMServices = Anthropic | Ollama;
export type { Input, Message };

const SERVICES = [Anthropic, Ollama];

interface LLMInterface {
    (input: Input, options?: Options): Promise<string>;
    (options: Options): Promise<string>;
    
    new (input: Input, options?: Options): LLMServices;
    new (options: Options): LLMServices;
    new (): LLMServices;
}

function LLMShortHandImpl(
    initOrOpts?: Input | Options,
    opts?: Options
): Promise<string> | LLMServices {

    let input: Input | undefined;
    let options : Options;

    if (typeof initOrOpts === "string" || Array.isArray(initOrOpts)) {
        input = initOrOpts as Input;
        options = opts || {};
    } else if (typeof initOrOpts === "object" && initOrOpts !== null) {
        input = undefined;
        options = initOrOpts as Options;
    } else {
        input = undefined;
        options = {};
    }

    let llm;

    const service = options?.service ?? config.service as ServiceName;
    const LLMClass = SERVICES.find(Service => Service.service === service);
    if (!LLMClass) throw new Error(`Service ${service} not found`);
    llm = new LLMClass(input, options);

    if (new.target) return llm;

    return llm.send();
};

const LLMShortHand = LLMShortHandImpl as LLMInterface;

export default LLMShortHand;
export { Anthropic, Ollama, SERVICES };