import type { ServiceName } from "./LLM.types";
import APIv1 from "./APIv1";

/**
 * @category LLMs
 */
export default class DeepSeek extends APIv1 {
    static readonly service: ServiceName = "deepseek";
    static DEFAULT_BASE_URL: string = "https://api.deepseek.com/v1/";
    static DEFAULT_MODEL: string = "deepseek-chat";
}
