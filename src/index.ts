import type { Options, Input, Message, ServiceName, Response, PartialStreamResponse } from "./LLM.types";

import Anthropic from "./anthropic";
import Ollama from "./ollama";
import OpenAI from "./openai";
import Google from "./google";
import xAI from "./xai";
import Groq from "./groq";
import DeepSeek from "./deepseek";
import LLM from "./LLM";
import APIv1 from "./APIv1";

import Attachment from "./Attachment";


import ModelUsage from "./ModelUsage";

import * as parsers from "./parsers";
import config from "./config";

export type * from "./LLM.types"

/**
 * @category Usage
 */
export type { ModelUsageType, ModelTag } from "./ModelUsage";

/**
 * @category LLMs
 */
export type LLMServices = Anthropic | Ollama | OpenAI | Google | xAI | Groq | DeepSeek | APIv1;

/**
 * @category LLMs
 */
export type { LLM, Anthropic, Ollama, OpenAI, Google, xAI, Groq, DeepSeek, APIv1 };

/**
 * @category Parsers
 */
export type { parsers };

/**
 * @category Usage
 */
export type { ModelUsage };

export type { Input, Message, Attachment };
export type { AnthropicOptions } from "./anthropic";
export type { OllamaOptions } from "./ollama";
export type { OpenAIOptions, OpenAITool } from "./openai";
export type { GoogleOptions, GoogleTool, GoogleMessage } from "./google";
export type { GroqOptions } from "./groq";
export type { APIv1Options } from "./APIv1";
export type { AttachmentType } from "./Attachment";

let SERVICES = [Anthropic, Ollama, OpenAI, Google, xAI, Groq, DeepSeek];

/**
 * @category LLMs
 */
export interface LLMInterface {
    (input: Input, options?: Options): Promise<string>;
    (options: Options): Promise<string>;
    
    new (input: Input, options?: Options): LLMServices;
    new (options: Options): LLMServices;
    new (): LLMServices;

    parsers: typeof parsers;
    services: any[];

    ModelUsage: typeof ModelUsage;

    LLM: typeof LLM;
    Anthropic: typeof Anthropic;
    Ollama: typeof Ollama;
    OpenAI: typeof OpenAI;
    Google: typeof Google;
    xAI: typeof xAI;
    Groq: typeof Groq;
    DeepSeek: typeof DeepSeek;
    APIv1: typeof APIv1;

    Attachment: typeof Attachment;

    register(LLMClass: typeof LLM): void;
    unregister(LLMClass: typeof LLM): void;
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
    let LLMClass = SERVICES.find(Service => Service.service === service);
    if (!LLMClass) LLMClass = APIv1;
    llm = new LLMClass(input, options);

    if (new.target) return llm;

    const response = llm.send() as Promise<string | Response | PartialStreamResponse>;
    return response;
};

const LLMWrapper = LLMShortHandImpl as LLMInterface;

LLMWrapper.parsers = parsers;
LLMWrapper.services = SERVICES;
LLMWrapper.ModelUsage = ModelUsage;

LLMWrapper.Anthropic = Anthropic;
LLMWrapper.Ollama = Ollama;
LLMWrapper.OpenAI = OpenAI;
LLMWrapper.Google = Google;
LLMWrapper.xAI = xAI;
LLMWrapper.Groq = Groq;
LLMWrapper.DeepSeek = DeepSeek;
LLMWrapper.APIv1 = APIv1;
LLMWrapper.LLM = LLM;

LLMWrapper.Attachment = Attachment;

LLMWrapper.register = (LLMClass: typeof LLM) => {
    SERVICES.push(LLMClass as any);
};

LLMWrapper.unregister = (LLMClass: typeof LLM) => {
    SERVICES = SERVICES.filter(Service => Service !== LLMClass);
};

export default LLMWrapper;