import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";

// fetch latest model info

describe("stream", function () {

    SERVICES.forEach(s => {
        const service = s.service;

        it(service, async function () {
            const stream = await LLM("the color of the sky is usually", { stream: true, service });

            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk;
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(20);
            expect(buffer.toLowerCase()).toContain("blue");
        });
    });

    // stream extended
});