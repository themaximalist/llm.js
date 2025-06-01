import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { Response } from "../src/LLM.js";

describe("chat", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        it(`${service} function`, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: 1, service });
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toEqual("blue");
        });

        it(`${service} instance`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 1, service });
            const response = await llm.send();
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} instance chat`, async function () {
            const llm = new LLM({ max_tokens: 1, service });
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
            const response = await llm.chat("the color of the sky is usually", { max_tokens: 20 });
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
            expect(llm.messages[1].content.length).toBeGreaterThan(50);
        });


        it(`${service} extended`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 1, service, extended: true });
            const response = await llm.send() as Response;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options?.max_tokens || response.options?.options?.num_predict).toBe(1);
            expect(response.messages.length).toBe(2);
            expect(response.messages[0].role).toBe("user");
            expect(response.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(response.messages[1].role).toBe("assistant");
            expect(response.messages[1].content.toLowerCase()).toContain("blue");
            expect(response.usage.input_tokens).toBeGreaterThan(0);
            expect(response.usage.output_tokens).toBeGreaterThan(0);
            expect(response.usage.total_tokens).toBe(response.usage.input_tokens + response.usage.output_tokens);
            expect(response.usage.local).toBe(llm.isLocal);
        });

    });
});

// streaming extended responses

// todo: test thinking

// todo: thinking automatically shifts to extended mode

// send / chat level options and overrides