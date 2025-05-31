import { describe, it, expect } from "vitest";
import LLM from "../src/index"

describe("verify connection", function () {
    it("ollama", async function () {
        const ollama = new LLM({ service: "ollama" });
        expect(await ollama.verifyConnection()).toBe(true);
    });

    it("anthropic", async function () {
        const anthropic = new LLM({ service: "anthropic" });
        expect(await anthropic.verifyConnection()).toBe(true);
    });
});