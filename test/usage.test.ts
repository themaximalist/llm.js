import { describe, it, expect } from "vitest";
import ModelUsage from "../src/ModelUsage";
import LLM, { SERVICES } from "../src/index";
import currentService from "./currentService.js";

describe("usage", function () {
    it("get cached models", async function () {
        const models = ModelUsage.getAll();
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
        const oldModels = ModelUsage.getAll();
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

    it("llm", async function () {
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

    it("unknown model", async function () {
       const model = ModelUsage.get("openai", "gpt-999");
       expect(model).toBeNull();
    });

    SERVICES.forEach(s => {
        if (currentService && s.service !== currentService) return;

        it(s.service, async function () {
            let empty = 0;
            const llm = new LLM({ service: s.service });
            const models = await llm.getQualityModels();
            const total = models.length;
            for (const model of models) {
                // console.log(model.model);
                expect(model.service).toBe(s.service);
                expect(model.model).toBeDefined();
                expect(model.model.length).toBeGreaterThan(0);
                expect(model.created).toBeDefined();
                expect(model.created).toBeInstanceOf(Date);
                if (!llm.isLocal) {
                    if (model.input_cost_per_token === 0 || model.output_cost_per_token === 0) {
                        // console.log(model.model);
                        empty++;
                    }
                }
            }

            const percent = (total - empty) / total;
            // console.log(percent);
            expect(percent).toBeGreaterThan(.5);
        });
    });
});

// override symlink
// override specific details