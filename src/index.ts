import type { Options, Input, Message, ServiceName, Response, PartialStreamResponse } from "./LLM.types";

import Anthropic, { AnthropicOptions } from "./anthropic";
import Ollama from "./ollama";
import OpenAI from "./openai";
import Google from "./google";
import xAI from "./xai";
import Groq from "./groq";
import DeepSeek from "./deepseek";
import LLMBase from "./LLM";
import APIv1 from "./APIv1";

import ModelUsage from "./ModelUsage";

import * as parsers from "./parsers";
import config from "./config";

/**
 * @category Parsers
 */
export type * from "./LLM.types"

/**
 * @category Usage
 */
export type { ModelUsageType } from "./ModelUsage";

/**
 * @category LLMs
 */
export type LLMServices = Anthropic | Ollama | OpenAI | Google | xAI | Groq | DeepSeek;

/**
 * @category LLMs
 */

export type { Input, Message };
export type { AnthropicOptions } from "./anthropic";
export type { OllamaOptions } from "./ollama";
export type { OpenAIOptions, OpenAITool } from "./openai";
export type { GoogleOptions, GoogleTool } from "./google";
export type { GroqOptions } from "./groq";
export type { APIv1Options } from "./APIv1";
export type { LLMBase, APIv1 };

const SERVICES = [Anthropic, Ollama, OpenAI, Google, xAI, Groq, DeepSeek];

/**
 * @category LLMs
 */
export interface LLM {
    (input: Input, options?: Options): Promise<string>;
    (options: Options): Promise<string>;
    
    new (input: Input, options?: Options): LLMServices;
    new (options: Options): LLMServices;
    new (): LLMServices;

    parsers: typeof parsers;
    services: any[];

    ModelUsage: typeof ModelUsage;

    LLM: typeof LLMBase;
    Anthropic: typeof Anthropic;
    Ollama: typeof Ollama;
    OpenAI: typeof OpenAI;
    Google: typeof Google;
    xAI: typeof xAI;
    Groq: typeof Groq;
    DeepSeek: typeof DeepSeek;
    APIv1: typeof APIv1;
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

const LLM = LLMShortHandImpl as LLM;

LLM.parsers = parsers;
LLM.services = SERVICES;
LLM.ModelUsage = ModelUsage;

LLM.Anthropic = Anthropic;
LLM.Ollama = Ollama;
LLM.OpenAI = OpenAI;
LLM.Google = Google;
LLM.xAI = xAI;
LLM.Groq = Groq;
LLM.DeepSeek = DeepSeek;
LLM.APIv1 = APIv1;
LLM.LLM = LLMBase;

export default LLM;