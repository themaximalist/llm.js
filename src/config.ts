import type { ServiceName } from "./LLM.types";

type Config = {
    service: ServiceName;
    max_tokens: number;
}

export default {
    service: "ollama",
    max_tokens: 1024,
} as Config;