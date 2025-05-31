import { describe, it, expect } from "vitest";
import ModelList from "../src/ModelList.ts";

// fetch latest model info

describe("model list", function () {
    it("get cached models", async function () {
        const models = ModelList.get();
        expect(models.length).toBeGreaterThan(100);
        for (const model of models) {
            expect(model.service).toBeDefined();
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(typeof model.max_tokens).toBe("number");
            expect(typeof model.max_input_tokens).toBe("number");
            expect(typeof model.max_output_tokens).toBe("number");
        }
    });

    it("get refreshed models", async function () {
        const oldModels = ModelList.get();
        const models = await ModelList.refresh();

        oldModels.pop(); // might be up to date
        expect(models.length).toBeGreaterThan(oldModels.length);

        for (const model of models) {
            expect(model.service).toBeDefined();
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(typeof model.max_tokens).toBe("number");
            expect(typeof model.max_input_tokens).toBe("number");
            expect(typeof model.max_output_tokens).toBe("number");
        }
    });

    it("models for service", async function () {
        const allModels = ModelList.get();
        const models = ModelList.get("openai");
        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
            expect(model.service).toBe("openai");
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(model.max_tokens).toBeGreaterThan(0);
            expect(model.max_input_tokens).toBeGreaterThan(0);
            expect(model.max_output_tokens).toBeGreaterThan(0);
        }
        expect(models.length).toBeLessThan(allModels.length);
    });
});