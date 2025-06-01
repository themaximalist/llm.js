import { describe, it, expect } from "vitest";
import ModelUsage from "../src/ModelUsage";
import type { ServiceName } from "../src/LLM";
import LLM from "../src/index";

describe("model usage", function () {
    it("get cached models", async function () {
        const models = ModelUsage.get();
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
        const oldModels = ModelUsage.get();
        const models = await ModelUsage.refresh();

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
        const allModels = ModelUsage.get();
        const models = ModelUsage.get("openai" as ServiceName);
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

    it("only llm", async function () {
        const llm = new LLM();

        expect(llm.modelUsage.length).toBeGreaterThan(0);
        for (const model of llm.modelUsage) {
            expect(model.service).toBeDefined();
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(typeof model.max_tokens).toBe("number");
            expect(typeof model.max_input_tokens).toBe("number");
            expect(typeof model.max_output_tokens).toBe("number");
        }

        llm.modelUsage.pop();
        let num = llm.modelUsage.length;
        await llm.refreshModelUsage();
        expect(llm.modelUsage.length).toBeGreaterThan(num);
    });

    it("anthropic", async function () {
        const models = ModelUsage.get("anthropic" as ServiceName);
        for (const model of models) {
            expect(model.service).toBe("anthropic");
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(typeof model.max_tokens).toBe("number");
            expect(typeof model.max_input_tokens).toBe("number");
            expect(typeof model.max_output_tokens).toBe("number");
        }
    });
});