import { beforeEach } from "vitest";
import { Anthropic, Ollama } from "../src/index.js";


beforeEach(() => {
    Anthropic.DEFAULT_MODEL = "claude-3-5-haiku-latest";
    Ollama.DEFAULT_MODEL = "deepseek-r1:8b";
});
  