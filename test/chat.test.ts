import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { Response, Options } from "../src/LLM.types";

describe("chat", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        it(`${service} function`, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: 100, service });
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("blue");
        });

        it(`${service} instance`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 50, service });
            const response = await llm.send();
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} instance chat`, async function () {
            const llm = new LLM({ max_tokens: 50, service });
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
            const response = await llm.chat("the color of the sky is usually", { max_tokens: 100 });
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
            expect(llm.messages[1].content.length).toBeGreaterThan(3);
        });


        it(`${service} extended`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 100, service, extended: true });
            const response = await llm.send() as Response;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.max_tokens).toBe(100);
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
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 100, service });
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
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: 100, service, temperature: 0, extended: true }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(0);
        });

        it(`${service} temperature override`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 100, service, temperature: 0, extended: true });
            const response = await llm.send({ temperature: 1 }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(1);
        });

        it(`${service} json`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, json: true } as Options;
            const response = await LLM("in one word the color of the sky is usually return a JSON object in the form of {color: '...'}", options) as any;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.color).toBe("blue");
        });

        it(`${service} extended json`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, json: true, extended: true } as Options;
            const response = await LLM("in one word the color of the sky is usually return a JSON object in the form of {color: '...'}", options) as any;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.content).toBeDefined();
            expect(response.content).toBeInstanceOf(Object);
            expect(response.content.color).toBe("blue");
        });

        it(`${service} markdown`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, parser: LLM.parsers.markdown } as Options;
            const response = await LLM("in one word the color of the sky is usually, return a markdown code block", options) as string;
            expect(response).toBeDefined();
            expect(response).toBeTypeOf("string");
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("blue");
        });

        it(`${service} tools`, async function () {
            const get_current_weather = {
                name: "get_current_weather",
                description: "Get the current weather for a city",
                input_schema: { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] },
            };

            const options = { max_tokens: 100, service, tools: [get_current_weather] } as Options;
            if (service === "ollama") options.model = "llama3.2:latest";

            const response = await LLM("what is the weather in Tokyo?", options) as unknown as Response;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.tool_calls).toBeDefined();
            expect(response.tool_calls!.length).toBe(1);
            expect(response.tool_calls![0].name).toBe("get_current_weather");
            expect(response.tool_calls![0].id).toBeDefined();
            expect(response.tool_calls![0].input.city).toBe("Tokyo");
            expect(response.messages.length).toBeGreaterThan(1);
            expect(response.messages[0].role).toBe("user");
            expect(response.messages[0].content).toBe("what is the weather in Tokyo?");

            if (response.messages.length === 2) {
                expect(response.messages[1].role).toBe("tool_call");
                expect(response.messages[1].content).toBeInstanceOf(Object);
                expect(response.messages[1].content.name).toBe("get_current_weather");
                expect(response.messages[1].content.input.city).toBe("Tokyo");
            } else {
                expect(response.messages[1].role).toBe("assistant");
                expect(response.messages[1].content).toBeDefined();
                expect(response.messages[1].content.length).toBeGreaterThan(0);
                expect(response.messages[2].role).toBe("tool_call");
                expect(response.messages[2].content).toBeInstanceOf(Object);
                expect(response.messages[2].content.name).toBe("get_current_weather");
                expect(response.messages[2].content.input.city).toBe("Tokyo");
            }
        });
    });

    it(`anthropic max_thinking_tokens`, async function () {
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