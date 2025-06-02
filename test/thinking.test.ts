import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { Response, PartialStreamResponse } from "../src/LLM.types.js";

describe("thinking", function () {
    SERVICES.forEach(s => {
        const service = s.service;

        it(`${service} chat`, async function () {
            const options = { max_tokens: 5048, service, think: true } as any;
            if (service === "anthropic") options.model = "claude-opus-4-20250514";
            if (service === "openai") options.model = "o4-mini";
            if (service === "ollama") options.model = "deepseek-r1:8b";
            const response = await LLM("in one word the color of the sky is usually", options) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.options.think).toBe(true);
            expect(response.thinking).toBeDefined();
            expect(response.thinking!.length).toBeGreaterThan(0);
            expect(response.thinking!.toLowerCase()).toContain("blue");
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");

            expect(response.service).toBe(service);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options?.max_tokens).toBe(5048);
            expect(response.messages.length).toBe(3);
            expect(response.messages[0].role).toBe("user");
            expect(response.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(response.messages[1].role).toBe("thinking");
            expect(response.messages[1].content).toBeDefined();
            expect(response.messages[1].content.toLowerCase()).toContain("blue");
            expect(response.messages[2].role).toBe("assistant");
            expect(response.messages[2].content.toLowerCase()).toContain("blue");
            expect(response.messages[2].content.length).toBeLessThan(response.messages[1].content.length);

            expect(response.usage.input_tokens).toBeGreaterThan(0);
            expect(response.usage.output_tokens).toBeGreaterThan(0);
            expect(response.usage.total_tokens).toBe(response.usage.input_tokens + response.usage.output_tokens);
            if (response.usage.local) {
                expect(response.usage.input_cost).toBe(0);
                expect(response.usage.output_cost).toBe(0);
                expect(response.usage.total_cost).toBe(0);
            } else {
                expect(response.usage.input_cost).toBeGreaterThan(0);
                expect(response.usage.output_cost).toBeGreaterThan(0);
                expect(response.usage.total_cost).toBeGreaterThan(0);
            }
        }, 30000);

        it(`${service} streaming`, async function () {
            const options = { stream: true, service, max_tokens: 2048, think: true } as any;
            if (service === "anthropic") options.model = "claude-opus-4-20250514";
            if (service === "openai") options.model = "o4-mini";
            if (service === "ollama") options.model = "deepseek-r1:8b";

            const llm = new LLM(options);
            const response = await llm.chat("keep it short, the color of the sky is usually") as PartialStreamResponse;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.options).toBeDefined();
            expect(response.options.stream).toBeTruthy();
            expect(response.options?.max_tokens).toBe(2048);
            expect(response.think).toBeTruthy();

            let buffer = "";
            let thinking = "";
            for await (const chunk of response.stream as AsyncGenerator<Record<string, string>>) {
                expect(chunk).toBeDefined();
                expect(chunk).toBeInstanceOf(Object);
                if (chunk.type === "thinking") thinking += chunk.content;
                else if (chunk.type === "content") buffer += chunk.content;
            }

            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(thinking).toBeDefined();
            expect(thinking.length).toBeGreaterThan(0);

            expect(buffer.toLowerCase()).toContain("blue");
            expect(thinking.toLowerCase()).toContain("blue");

            expect(llm.messages.length).toBe(3);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("keep it short, the color of the sky is usually");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
            expect(llm.messages[1].role).toBe("thinking");
            expect(llm.messages[2].role).toBe("assistant");
            expect(llm.messages[2].content.toLowerCase()).toContain("blue");
            expect(llm.messages[2].content.length).toBeLessThan(llm.messages[1].content.length);

            const completed = await response.complete();
            expect(completed).toBeDefined();
            expect(completed.content).toBeDefined();
            expect(completed.content.length).toBeGreaterThan(0);
            expect(completed.content.toLowerCase()).toContain("blue");
            expect(completed.thinking).toBeDefined();
            expect(completed.thinking!.length).toBeGreaterThan(0);
            expect(completed.thinking!.toLowerCase()).toContain("blue");
            expect(completed.service).toBe(service);
            expect(completed.options).toBeDefined();
            expect(completed.options.stream).toBeTruthy();
            expect(completed.options.think).toBeTruthy();
            expect(completed.messages.length).toBe(3);
            expect(completed.messages[0].role).toBe("user");
            expect(completed.messages[0].content).toBe("keep it short, the color of the sky is usually");
            expect(completed.messages[1].role).toBe("thinking");
            expect(completed.messages[1].content.toLowerCase()).toContain("blue");
            expect(completed.messages[2].role).toBe("assistant");
            expect(completed.messages[2].content.toLowerCase()).toContain("blue");

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
        }, 30000);
    });

});