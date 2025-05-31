import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama, type Message } from "../src/index.js";

// fetch latest model info

describe("stream", function () {
    it.only("ollama", async function () {
        const stream = await LLM("the color of the sky is usually");

        let buffer = "";
        for await (const chunk of stream) {
            buffer += chunk;
        }
        console.log(buffer);
    });

    // stream extended
});