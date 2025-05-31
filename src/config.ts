import type { LLMServiceName } from "./LLM";

type Config = {
    service: LLMServiceName;
    max_tokens: number;
}

export default {
    service: "ollama",
    max_tokens: 1024,
} as Config;