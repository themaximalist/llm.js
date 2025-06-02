import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { PartialStreamResponse } from "../src/LLM.types.js";

describe("stream", function () {
    expect(SERVICES.length).toBeGreaterThan(0);

    SERVICES.forEach(s => {
        const service = s.service;

        it(service, async function () {
            const stream = await LLM("keep it short, the color of the sky is usually", { stream: true, service, max_tokens: 100});

            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk
                if (buffer.toLowerCase().includes("blue")) break;
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toLowerCase()).toContain("blue");
        });

        it(`${service} instance`, async function () {
            const llm = new LLM({ stream: true, service, max_tokens: 50});
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
            const llm = new LLM({ stream: true, service, max_tokens: 500, extended: true });
            if (service === "openai") llm.model = "gpt-4o-mini";
            const prompt = "tell a short story that starts with the word blue";
            const response = await llm.chat(prompt) as PartialStreamResponse;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.options).toBeDefined();
            expect(response.options.stream).toBeTruthy();
            expect(response.options?.max_tokens).toBe(500);
            expect(response.think).toBeFalsy();

            let buffer = "";
            for await (const chunk of response.stream as AsyncGenerator<Record<string, string>>) {
                if (chunk.type === "content") buffer += chunk.content;
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toLowerCase()).toContain("blue");
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe(prompt);
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
            expect(completed.messages[0].content).toBe(prompt);
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

        it(`${service} abort`, async function () {
            const llm = new LLM("hey what's up?", { stream: true, max_tokens: 5048, service });
            return new Promise((resolve, reject) => {
                llm.send().then().catch((e: any) => {
                    expect(e.name).toBe("AbortError");
                    resolve(true);
                });

                setTimeout(() => { llm.abort() }, 50);
            });
        });

    });
});