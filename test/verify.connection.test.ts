import { describe, it, expect } from "vitest";
import LLM from "../src/index"
import currentService from "./currentService.js";

describe("verify connection", function () {
    LLM.services.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(service, async function () {
            const llm = new LLM({ service });
            expect(await llm.verifyConnection()).toBe(true);
        });
    });
});