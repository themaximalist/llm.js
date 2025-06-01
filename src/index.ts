import Anthropic from "./anthropic";
import Ollama from "./ollama";
import config from "./config";
import type { Options, Input, Message, ServiceName, Response, PartialStreamResponse } from "./LLM.types";

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
): Promise<string | Response | PartialStreamResponse> | LLMServices {

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

    const response = llm.send() as Promise<string | Response | PartialStreamResponse>;
    return response;
};

const LLMShortHand = LLMShortHandImpl as LLMInterface;

export default LLMShortHand;
export { Anthropic, Ollama, SERVICES };