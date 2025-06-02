import { beforeEach } from "vitest";
import { Anthropic, Ollama, OpenAI, Google } from "../src/index.js";


beforeEach(() => {
    Anthropic.DEFAULT_MODEL = "claude-3-5-haiku-latest";
    Ollama.DEFAULT_MODEL = "deepseek-r1:8b";
    OpenAI.DEFAULT_MODEL = "gpt-4.1-nano-2025-04-14";
    Google.DEFAULT_MODEL = "gemini-2.0-flash-lite";
});
  