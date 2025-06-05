import type { ServiceName, Options, Model } from "./LLM.types";
import APIv1, { APIv1Options } from "./APIv1";
import { keywordFilter } from "./utils";

export default class DeepSeek extends APIv1 {
    static readonly service: ServiceName = "deepseek";
    static DEFAULT_BASE_URL: string = "https://api.deepseek.com/v1/";
    static DEFAULT_MODEL: string = "deepseek-chat";
}
