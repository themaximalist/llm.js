import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama, type Message } from "../src/index.js";

// fetch latest model info

describe("chat", function () {
    it.only("ollama", async function () {
        const response = await LLM("in one word the color of the sky is usually", { max_tokens: 1 });
        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(0);
        expect(response.toLowerCase()).toEqual("blue");
    });


    // max tokens
    // stream extended
});