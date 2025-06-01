import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index"

describe("verify connection", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        it(service, async function () {
            const llm = new LLM({ service });
            expect(await llm.verifyConnection()).toBe(true);
        });
    });
});