import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";

describe("stream", function () {
    expect(SERVICES.length).toBeGreaterThan(0);

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


    SERVICES.forEach(s => {
        const service = s.service;

        it.only(`${service} instance`, async function () {
            const llm = new LLM({ stream: true, service, max_tokens: 20});
            const stream = await llm.chat("keep it short, the color of the sky is usually");

            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toLowerCase()).toContain("blue");
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("keep it short, the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });
    });

    // stream history with instance

    // stream extended
    // stream thinking
});