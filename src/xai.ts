import type { ServiceName, Options, Model } from "./LLM.types";
import APIv1 from "./APIv1";
import { keywordFilter } from "./utils";

export type XAI = Options & {
    reasoning_effort?: "low" | "high"
}

export default class xAI extends APIv1 {
    static readonly service: ServiceName = "xai";
    static DEFAULT_BASE_URL: string = "https://api.x.ai/v1/";
    static DEFAULT_MODEL: string = "grok-3";
    static isLocal: boolean = false;

    filterQualityModel(model: Model): boolean {
        const keywords = ["audio", "vision", "image"];
        return keywordFilter(model.model, keywords);
    }
}
