import { beforeEach } from "vitest";
import LLM from "../src/index.js";
import { isBrowser } from "../src/utils.js";


beforeEach(() => {
    if (isBrowser()) {
        /* @ts-ignore */
        const env = import.meta.env as any;
        for (const key in env) {
            if (key.indexOf("API_KEY") !== -1) {
                const name = key.replace("VITE_", "");
                const value = env[key];
                if (value) {
                    localStorage.setItem(name, value);
                }
            }
        }
    }

    LLM.Anthropic.DEFAULT_MODEL = "claude-3-5-haiku-latest";
    LLM.Ollama.DEFAULT_MODEL = "deepseek-r1:8b";
    LLM.OpenAI.DEFAULT_MODEL = "gpt-4.1-nano-2025-04-14";
});
  