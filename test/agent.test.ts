// TODO: need the full chain of usage
// TODO: need the full chain of completed_tool_calls

import logger from "../src/logger";
const log = logger("llm.js:test:tool");

import { describe, it, expect } from "vitest";
import LLM from "../src/index.js";
import type { Response, Options, PartialStreamResponse } from "../src/LLM.types.js";
import currentService from "./currentService.js";

describe("agent", function () {
    LLM.services.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it.only(`${service} chat`, async function () {

            function get_current_weather({ city }: { city: string }) {
                return `The weather in ${city} is sunny and 75 degrees`;
            }

            get_current_weather.description = "Get the current weather for a city";
            get_current_weather.input_schema = { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] };

            const options = { max_tokens: 256, service, tools: [get_current_weather] } as Options;
            if (service === "ollama") options.model = "gpt-oss:20b";
            const agent = new LLM(options);
            const response = await agent.run("what is the weather in Tokyo?") as Response;

            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("sunny");
            expect(response.content.toLowerCase()).toContain("75");
            expect(response.tool_calls).toBeDefined();
        });

        it(`${service} stream`, async function () {
            const get_current_weather = {
                name: "get_current_weather",
                description: "Get the current weather for a city",
                input_schema: { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] },
            };

            const options = { max_tokens: 2048, stream: true, service, tools: [get_current_weather] } as Options;
            if (service === "ollama") options.model = "llama3.2:latest";
            if (service === "deepseek" ) { log.warn("Skipping deepseek streaming tool use test"); return; }

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

                // groq is a little buggy right now, in that non-thinking models are not handling tool use properly
                if (service === "groq") {
                    expect(llm.messages[1].role).toBe("thinking");
                    expect(llm.messages[1].content).toBeDefined();
                } else {
                    expect(llm.messages[1].role).toBe("assistant");
                    expect(llm.messages[1].content).toBeDefined();
                }

                expect(llm.messages[2].role).toBe("tool_call");
                expect(llm.messages[2].content.name).toBe("get_current_weather");
                expect(llm.messages[2].content.id).toBeDefined();
                expect(llm.messages[2].content.input).toBeDefined();
                expect(llm.messages[2].content.input.city).toBe("Tokyo");
            } else {
                expect.fail(`Expected 2 or 3 messages, got ${llm.messages.length}`);
            }

            for (const tool_call of completed.tool_calls!) {
                llm.toolResult({
                    id: tool_call.id,
                    name: tool_call.name,
                    result: "Sunny 75 degrees",
                })
            }

            const response2 = await llm.send() as unknown as PartialStreamResponse;
            let content = "";
            for await (const message of response2.stream as AsyncGenerator<Record<string, string>>) {
                if (message.type === "content") content += message.content;
            }

            expect(content).toBeDefined();
            expect(content.length).toBeGreaterThan(0);
            expect(content.toLowerCase()).toContain("sunny");
            expect(content.toLowerCase()).toContain("75");
            expect(content.toLowerCase()).toContain("degrees");
        });

    });
});