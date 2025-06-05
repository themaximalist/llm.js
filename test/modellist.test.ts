import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index"
import currentService from "./currentService.js";

describe("model list", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(service, async function () {
            const llm = new LLM({ service });
            const models = await llm.getModels();
            expect(models.length).toBeGreaterThan(0);
            for (const model of models) {
                expect(model.service).toBe(service);
                expect(model.model).toBeDefined();
                expect(model.model.length).toBeGreaterThan(0);
                expect(model.created).toBeDefined();
                expect(model.created).toBeInstanceOf(Date);
            }
        });
    });
});