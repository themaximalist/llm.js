import LLM, { type ServiceName } from "./LLM";

export default class Anthropic extends LLM {
    static readonly service: ServiceName = "anthropic";
    static readonly DEFAULT_BASE_URL: string = "https://api.anthropic.com/v1";
    static readonly DEFAULT_MODEL: string = "claude-3-5-sonnet-20240620";
}