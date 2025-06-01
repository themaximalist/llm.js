import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { PartialStreamResponse } from "../src/LLM.js";

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

        it(`${service} instance`, async function () {
            const llm = new LLM({ stream: true, service, max_tokens: 20});
            const stream = await llm.chat("keep it short, the color of the sky is usually") as AsyncGenerator<string>;

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

        it(`${service} extended`, async function () {
            const llm = new LLM({ stream: true, service, max_tokens: 20, extended: true });
            const response = await llm.chat("keep it short, the color of the sky is usually") as PartialStreamResponse;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.options).toBeDefined();
            expect(response.options.stream).toBeTruthy();
            expect(response.options?.max_tokens || response.options?.options?.num_predict).toBe(20);

            let buffer = "";
            for await (const chunk of response.stream) {
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

            const completed = await response.complete();
            expect(completed).toBeDefined();
            expect(completed.content).toBeDefined();
            expect(completed.content.length).toBeGreaterThan(0);
            expect(completed.content.toLowerCase()).toContain("blue");
            expect(completed.service).toBe(service);
            expect(completed.options).toBeDefined();
            expect(completed.options.stream).toBeTruthy();
            expect(completed.messages.length).toBe(2);
            expect(completed.messages[0].role).toBe("user");
            expect(completed.messages[0].content).toBe("keep it short, the color of the sky is usually");
            expect(completed.messages[1].role).toBe("assistant");
            expect(completed.messages[1].content.toLowerCase()).toContain("blue");


            expect(completed.usage.input_tokens).toBeGreaterThan(0);
            expect(completed.usage.output_tokens).toBeGreaterThan(0);
            expect(completed.usage.total_tokens).toBe(completed.usage.input_tokens + completed.usage.output_tokens);
            expect(completed.usage.local).toBe(llm.isLocal);
            if (llm.isLocal) {
                expect(completed.usage.input_cost).toBe(0);
                expect(completed.usage.output_cost).toBe(0);
                expect(completed.usage.total_cost).toBe(0);
            } else {
                expect(completed.usage.input_cost).toBeGreaterThan(0);
                expect(completed.usage.output_cost).toBeGreaterThan(0);
                expect(completed.usage.total_cost).toBeGreaterThan(0);
            }
        });
    });

    // stream thinking
});