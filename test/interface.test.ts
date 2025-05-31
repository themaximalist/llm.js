import { describe, it, expect } from "vitest";
import LLM from "../src/index.js";

// initialize object
// short-hand

// fetch latest model info

describe("LLM Interface", function () {
    it("class interface", async function () {
        const llm = new LLM("the color of the sky is usually");
        const response = await llm.send();
        expect(response.toLowerCase()).toContain("blue");
    });

    it("function interface", async function () {
        const response = await LLM("the color of the sky is usually");
        expect(response.toLowerCase()).toContain("blue");
    });
});