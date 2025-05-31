import type { LLMServiceName } from "./LLM";

type Config = {
    service: LLMServiceName;
}

export default {
    service: "ollama",
} as Config;