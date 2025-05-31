import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama } from "../src/index.js";

// initialize object
// short-hand

// fetch latest model info

describe("LLM Interface", function () {
    it("class interface", async function () {
        let llm = new LLM("the color of the sky is usually");
        expect(llm).toBeInstanceOf(Ollama);
        expect(llm.service).toBe("ollama");
        const response = await llm.send();
        expect(response.toLowerCase()).toContain("blue");

        llm = new LLM("the color of the sky is usually", { service: "anthropic" });
        expect(llm).toBeInstanceOf(Anthropic);
        expect(llm.service).toBe("anthropic");
        const response2 = await llm.send();
        expect(response2.toLowerCase()).toContain("blue");

    });

    it("function interface", async function () {
        const response = await LLM("the color of the sky is usually");
        expect(response.toLowerCase()).toContain("blue");
    });
});