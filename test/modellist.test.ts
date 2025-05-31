import { describe, it, expect } from "vitest";
import LLM from "../src/index"

describe("model list", function () {
    it("ollama", async function () {
        const ollama = new LLM({ service: "ollama" });
        const models = await ollama.getModels();
        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
            expect(model.service).toBe("ollama");
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(model.created).toBeDefined();
            expect(model.created).toBeInstanceOf(Date);
        }
    });

    it("anthropic", async function () {
        const llm = new LLM({ service: "anthropic" });
        const models = await llm.getModels();
        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
            expect(model.service).toBe("anthropic");
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(model.created).toBeDefined();
            expect(model.created).toBeInstanceOf(Date);
        }
    });
});