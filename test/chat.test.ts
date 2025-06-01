import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";

describe("chat", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        it(service, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: 1, service });
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toEqual("blue");
        });
    });
});