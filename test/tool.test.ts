import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";
import type { Response, Options, PartialStreamResponse } from "../src/LLM.types.js";
import currentService from "./currentService.js";

describe("tool", function () {
    SERVICES.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(`${service} chat`, async function () {
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

        it(`${service} stream`, async function () {
            const get_current_weather = {
                name: "get_current_weather",
                description: "Get the current weather for a city",
                input_schema: { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] },
            };

            const options = { max_tokens: 1024, stream: true, service, tools: [get_current_weather] } as Options;
            if (service === "ollama") options.model = "llama3.2:latest";

            const llm = new LLM(options);
            const response = await llm.chat("what is the weather in Tokyo?") as PartialStreamResponse;

            for await (const chunk of response.stream) {}

            const completed = await response.complete();

            expect(completed).toBeDefined();
            expect(completed.tool_calls).toBeDefined();
            expect(completed.tool_calls!.length).toBe(1);
            expect(completed.tool_calls![0].name).toBe("get_current_weather");
            expect(completed.tool_calls![0].input).toBeDefined();
            expect(completed.tool_calls![0].input.city).toBe("Tokyo");

            if (llm.messages.length === 2) {
                expect(llm.messages.length).toBe(2);
                expect(llm.messages[0].role).toBe("user");
                expect(llm.messages[0].content).toBe("what is the weather in Tokyo?");
                expect(llm.messages[1].role).toBe("tool_call");
                expect(llm.messages[1].content.name).toBe("get_current_weather");
                expect(llm.messages[1].content.id).toBeDefined();
                expect(llm.messages[1].content.input).toBeDefined();
                expect(llm.messages[1].content.input.city).toBe("Tokyo");
            } else if (llm.messages.length === 3) {
                expect(llm.messages.length).toBe(3);
                expect(llm.messages[0].role).toBe("user");
                expect(llm.messages[0].content).toBe("what is the weather in Tokyo?");
                expect(llm.messages[1].role).toBe("assistant");
                expect(llm.messages[1].content).toBeDefined();
                expect(llm.messages[2].role).toBe("tool_call");
                expect(llm.messages[2].content.name).toBe("get_current_weather");
                expect(llm.messages[2].content.id).toBeDefined();
                expect(llm.messages[2].content.input).toBeDefined();
                expect(llm.messages[2].content.input.city).toBe("Tokyo");
            } else {
                expect.fail(`Expected 2 or 3 messages, got ${llm.messages.length}`);
            }
        });

    });
});