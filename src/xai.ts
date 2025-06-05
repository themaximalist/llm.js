import type { ServiceName, Options } from "./LLM.types";
import APIv1 from "./APIv1";

export type XAI = Options & {
    // stream_options?: {
    //     include_usage?: boolean;
    // },
    reasoning_effort?: "low" | "high"
}

export default class xAI extends APIv1 {
    static readonly service: ServiceName = "xai";
    static DEFAULT_BASE_URL: string = "https://api.x.ai/v1/";
    static DEFAULT_MODEL: string = "grok-3";
    static isLocal: boolean = false;
}
