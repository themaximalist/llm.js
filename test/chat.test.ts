import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { Response } from "../src/LLM.types";
import currentService from "./currentService.js";

describe("chat", function () {
    SERVICES.forEach(s => {
        const service = s.service;

        let max_tokens = 200;
        if (currentService && service !== currentService) return;
        if (service === "google") max_tokens = 5048; // google returns no response if max_tokens is hit!

        it(`${service} function`, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service });
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("blue");
        });

        it(`${service} instance`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service });
            const response = await llm.send();
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} instance chat`, async function () {
            const llm = new LLM({ max_tokens, service });
            const response = await llm.chat("in one word the color of the sky is usually");
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} settings override`, async function () {
            const llm = new LLM({ service });
            const response = await llm.chat("the color of the sky is usually", { max_tokens: max_tokens });
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
            expect(llm.messages[1].content.length).toBeGreaterThan(3);
        });


        it(`${service} extended`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, extended: true });
            const response = await llm.send() as Response;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.max_tokens).toBe(max_tokens);
            expect(response.messages.length).toBe(2);
            expect(response.messages[0].role).toBe("user");
            expect(response.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(response.messages[1].role).toBe("assistant");
            expect(response.messages[1].content.toLowerCase()).toContain("blue");
            expect(response.usage.input_tokens).toBeGreaterThan(0);
            expect(response.usage.output_tokens).toBeGreaterThan(0);
            expect(response.usage.total_tokens).toBe(response.usage.input_tokens + response.usage.output_tokens);
            expect(response.usage.local).toBe(llm.isLocal);
            if (llm.isLocal) {
                expect(response.usage.input_cost).toBe(0);
                expect(response.usage.output_cost).toBe(0);
                expect(response.usage.total_cost).toBe(0);
            } else {
                expect(response.usage.input_cost).toBeGreaterThan(0);
                expect(response.usage.output_cost).toBeGreaterThan(0);
                expect(response.usage.total_cost).toBeGreaterThan(0);
            }
        });

        it(`${service} abort`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service });
            return new Promise((resolve, reject) => {
                llm.send().then(() => {
                    resolve(false);
                }).catch((e: any) => {
                    expect(e.name).toBe("AbortError");
                    resolve(true);
                });

                setTimeout(() => { llm.abort() }, 50);
            });
        });

        it(`${service} temperature`, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, temperature: 1, extended: true }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(1);
        });

        it(`${service} temperature override`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, temperature: 0, extended: true });
            const response = await llm.send({ temperature: 1 }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(1);
        });
    });

    it.skip(`anthropic max_thinking_tokens`, async function () {
        const service = "anthropic";
        const options = { max_tokens: 5048, max_thinking_tokens: 1025, service, think: true, model: "claude-opus-4-20250514" } as any;
        const response = await LLM("in one word the color of the sky is usually", options) as unknown as Response;
        expect(response).toBeDefined();
        expect(response.options.think).toBe(true);
        expect(response.options.max_thinking_tokens).toBe(1025);
        expect(response.thinking).toBeDefined();
        expect(response.thinking!.length).toBeGreaterThan(0);
        expect(response.thinking!.toLowerCase()).toContain("blue");
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.content.toLowerCase()).toContain("blue");
    });
});