import APIv1 from "./APIv1";
import type { ServiceName } from "./LLM.types";

/**
 * @category LLMs
 */
export default class OpenRouter extends APIv1 {
    static readonly service: ServiceName = "openrouter";
    static DEFAULT_BASE_URL: string = "https://openrouter.ai/api/v1";
    static DEFAULT_MODEL: string = "google/gemini-2.5-flash";
}
