import { describe, it, expect } from "vitest";
import ModelUsage from "../src/ModelUsage";
import type { ServiceName } from "../src/LLM.types";
import LLM, { SERVICES } from "../src/index";

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

    SERVICES.forEach(s => {
        it(s.service, async function () {
            const llm = new LLM({ service: s.service });
            const models = await llm.getModels();
            for (const model of models) {
                expect(model.service).toBe(s.service);
                expect(model.model).toBeDefined();
                expect(model.model.length).toBeGreaterThan(0);
                expect(model.created).toBeDefined();
                expect(model.created).toBeInstanceOf(Date);
            }
        });
    });
});