import { describe, it, expect } from "vitest";
import LLM from "../src/index"

describe("model list", function () {
    it("get models", async function () {
        const ollama = new LLM({ service: "ollama" });
        const models = await ollama.getModels();
        console.log(models);
        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
            expect(model.service).toBe("ollama");
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(model.created).toBeDefined();
            expect(model.created).toBeInstanceOf(Date);
        }
    });
});

// verify connection