import { describe, it, expect } from "vitest";
import ModelUsage, { ModelUsageType } from "../src/ModelUsage";
import LLM from "../src/index";
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

        expect(llm.modelUsage.models().length).toBeGreaterThan(0);
        for (const model of llm.modelUsage.models()) {
            expect(model.service).toBeDefined();
            expect(model.model).toBeDefined();
            expect(model.model.length).toBeGreaterThan(0);
            expect(typeof model.max_tokens).toBe("number");
            expect(typeof model.max_input_tokens).toBe("number");
            expect(typeof model.max_output_tokens).toBe("number");
        }

        const models = llm.modelUsage.models();
        models.pop();
        await llm.refreshModelUsage();
        expect(llm.modelUsage.models().length).toBeGreaterThan(models.length);
    });

    it("unknown model", async function () {
       const model = ModelUsage.get("openai", "gpt-999");
       expect(model).toBeNull();
    });

    it("custom model", async function () {
        ModelUsage.addCustom({
            model: "gpt-999",
            service: "openai",
            input_cost_per_token: 10,
            output_cost_per_token: 20,
        } as ModelUsageType);

        const customs = ModelUsage.getCustoms();
        expect(customs).toBeDefined();
        expect(Object.keys(customs).length).toBe(1);
        expect(customs["openai/gpt-999"]).toBeDefined();
        expect(customs["openai/gpt-999"].input_cost_per_token).toBe(10);
        expect(customs["openai/gpt-999"].output_cost_per_token).toBe(20);

        const model = ModelUsage.get("openai", "gpt-999");
        expect(model).toBeDefined();
        expect(model?.mode).toBe("chat");
        expect(model?.service).toBe("openai");
        expect(model?.model).toBe("gpt-999");
        expect(model?.input_cost_per_token).toBe(10);
        expect(model?.output_cost_per_token).toBe(20);

        ModelUsage.removeCustom("openai", "gpt-999");
        const model2 = ModelUsage.get("openai", "gpt-999");
        expect(model2).toBeNull();
    });

    it("custom model with refresh", async function () {
        ModelUsage.addCustom({
            model: "gpt-999",
            service: "openai",
            input_cost_per_token: 10,
            output_cost_per_token: 20,
        } as ModelUsageType);

        const models = await ModelUsage.refresh();
        const model = models.find(m => m.model === "gpt-999");
        expect(model).toBeDefined();
        expect(model?.input_cost_per_token).toBe(10);
        expect(model?.output_cost_per_token).toBe(20);

        ModelUsage.removeCustom("openai", "gpt-999");
        const model2 = ModelUsage.get("openai", "gpt-999");
        expect(model2).toBeNull();
    });

    LLM.services.forEach(s => {
        if (currentService && s.service !== currentService) return;

        it(s.service, async function () {
            let empty = 0;
            const llm = new LLM({ service: s.service });
            const models = await llm.getQualityModels();
            const total = models.length;
            for (const model of models) {
                expect(model.service).toBe(s.service);
                expect(model.model).toBeDefined();
                expect(model.model.length).toBeGreaterThan(0);
                expect(model.created).toBeDefined();
                expect(model.created).toBeInstanceOf(Date);
                expect(model.created!.getTime()).toBeGreaterThan(new Date("2016-01-01").getTime());
                expect(model.created!.getTime()).toBeLessThan(new Date("2035-01-01").getTime());
                if (!llm.isLocal) {
                    if (model.input_cost_per_token === 0 || model.output_cost_per_token === 0) {
                        empty++;
                    }
                }
            }

            const percent = (total - empty) / total;
            expect(percent).toBeGreaterThanOrEqual(0.5);
        });

        it(`${s.service} instance`, async function () {
            const llm = new LLM({ service: s.service });
            expect(llm.modelUsage).toBeDefined();
            expect(llm.modelUsage).toBeInstanceOf(ModelUsage);
            expect(llm.modelUsage.models().length).toBeGreaterThan(0);
            for (const model of llm.modelUsage.models()) {
                expect(model.model).toBeDefined();
                expect(model.model.length).toBeGreaterThan(0);
            }
        });

    });

    it("tags", async function () {
        const support = {
            "supports_function_calling": 0,
            "supports_vision": 0,
            "supports_web_search": 0,
            "supports_audio_input": 0,
            "supports_audio_output": 0,
            "supports_prompt_caching": 0,
            "tags": 0,
        };

        for (const service of LLM.services) {
            const llm = new LLM({ service: service.service });
            const models = await llm.getQualityModels();
            for (const model of models) {
                if (!model.tags) console.log(model);
                expect(model.tags).toBeDefined();
                if (model.tags.length > 0) support["tags"]++;
                if (model.supports_function_calling) support["supports_function_calling"]++;
                if (model.supports_vision) support["supports_vision"]++;
                if (model.supports_web_search) support["supports_web_search"]++;
                if (model.supports_audio_input) support["supports_audio_input"]++;
                if (model.supports_audio_output) support["supports_audio_output"]++;
                if (model.supports_prompt_caching) support["supports_prompt_caching"]++;
            }
        }

        for (const key in support) {
            expect(support[key as keyof typeof support]).toBeGreaterThan(0);
        }
    });

});