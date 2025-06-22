import type { ServiceName } from "./LLM.types";
import APIv1 from "./APIv1";

/**
 * @category LLMs
 */
export default class xAI extends APIv1 {
    static readonly service: ServiceName = "xai";
    static DEFAULT_BASE_URL: string = "https://api.x.ai/v1/";
    static DEFAULT_MODEL: string = "grok-3";
}
