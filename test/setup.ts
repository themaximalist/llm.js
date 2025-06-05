import { beforeEach } from "vitest";
import { Anthropic, Ollama, OpenAI } from "../src/index.js";
import { isBrowser, isNode } from "../src/utils.js";


beforeEach(() => {
    if (isBrowser()) {
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

    Anthropic.DEFAULT_MODEL = "claude-3-5-haiku-latest";
    Ollama.DEFAULT_MODEL = "deepseek-r1:8b";
    OpenAI.DEFAULT_MODEL = "gpt-4.1-nano-2025-04-14";
});
  