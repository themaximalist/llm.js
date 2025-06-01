import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { PartialStreamResponse } from "../src/LLM.types";

describe("stream", function () {
    expect(SERVICES.length).toBeGreaterThan(0);

    SERVICES.forEach(s => {
        const service = s.service;

        it(service, async function () {
            const stream = await LLM("keep it short, the color of the sky is usually", { stream: true, service, max_tokens: 50});

            let buffer = "";
            for await (const chunk of stream) {
                buffer += chunk
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
            const llm = new LLM({ stream: true, service, max_tokens: 100, extended: true });
            const response = await llm.chat("keep it short, the color of the sky is usually") as PartialStreamResponse;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.options).toBeDefined();
            expect(response.options.stream).toBeTruthy();
            expect(response.options?.max_tokens).toBe(100);
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

        it(`${service} thinking`, async function () {
            const options = { stream: true, service, max_tokens: 2048, think: true } as any;
            if (service === "anthropic") options.model = "claude-opus-4-20250514";
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

        it(`${service} abort`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { stream: true, max_tokens: 1024, service });
            let buffer = "";
            return new Promise((resolve, reject) => {
                llm.send().then(async (stream) => {
                    for await (const chunk of stream as AsyncGenerator<string>) { buffer += chunk }
                    resolve(false); // shouldn't finish
                }).catch((e: any) => {
                    expect(e.name).toBe("AbortError");
                    expect(buffer.length).toBeGreaterThan(0);
                    resolve(true);
                });

                setTimeout(() => { llm.abort() }, 1500);
            });
        });

        it(`${service} json`, async function () {
            const options = { stream: true, service, max_tokens: 50, json: true, extended: true } as any;
            const prompt = "keep it short, the color of the sky is usually, return a JSON object in the form of {color: '...'}";
            const response = await LLM(prompt, options) as unknown as PartialStreamResponse;

            for await (const chunk of response.stream) {}

            const completed = await response.complete();
            expect(completed).toBeDefined();
            const content = completed.content as any;
            expect(content).toBeDefined();
            expect(content).toBeInstanceOf(Object);
            expect(content.color).toBe("blue");
        });
    });
});