import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";

describe("stream", function () {

    SERVICES.forEach(s => {
        const service = s.service;

        it(service, async function () {
            const stream = await LLM("keep it short, the color of the sky is usually", { stream: true, service, max_tokens: 20});

            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toLowerCase()).toContain("blue");
        });
    });

    // stream extended
    // stream thinking
});