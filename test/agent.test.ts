// TODO: need the full chain of usage
// TODO: need the full chain of completed_tool_calls

import logger from "../src/logger";
const log = logger("llm.js:test:tool");

import { describe, it, expect } from "vitest";
import LLM from "../src/index.js";
import type { Response, Options, ResponseType, StreamResponse } from "../src/LLM.types.js";
import currentService from "./currentService.js";

describe("agent", function () {
    LLM.services.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(`${service} chat`, async function () {

            function get_current_weather({ city }: { city: string }) {
                return `The weather in ${city} is sunny and 75 degrees`;
            }

            get_current_weather.description = "Get the current weather for a city";
            get_current_weather.input_schema = { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] };

            const options = { max_tokens: 256, service, tools: [get_current_weather] } as Options;
            // if (service === "ollama") options.model = "gpt-oss:20b";
            if (service === "ollama") options.model = "qwen3:8b";
            const agent = new LLM(options);
            const responses = await agent.run("what is the weather in Tokyo?") as Response[];
            expect(responses).toBeDefined();
            expect(responses.length).toBe(2);
            expect(responses[1].content).toBeDefined();
            expect(responses[1].content.length).toBeGreaterThan(0);
            expect(responses[1].content.toLowerCase()).toContain("sunny");
            expect(responses[1].content.toLowerCase()).toContain("75");
        });

        it(`${service} stream`, async function () {
            function get_current_weather({ city }: { city: string }) {
                return `The weather in ${city} is sunny and 75 degrees`;
            }

            get_current_weather.description = "Get the current weather for a city";
            get_current_weather.input_schema = { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] };

            const options = { max_tokens: 2048, service, tools: [get_current_weather], stream: true, think: true } as Options;
            // if (service === "ollama") options.model = "gpt-oss:20b";
            if (service === "ollama") options.model = "qwen3:8b";
            if (service === "anthropic") options.model = "claude-opus-4-20250514";

            let seen = { thinking: false, content: false, tool_calls: false, tool_result: false };
            function handle_message(message: any) {
                if (message.type === "thinking") seen.thinking = true;
                if (message.type === "content") seen.content = true;
                if (message.type === "tool_calls") seen.tool_calls = true;
                if (message.type === "tool_result") seen.tool_result = true;
            }

            options.onMessage = handle_message;

            const agent = new LLM(options);

            const responses = await agent.run("what is the weather in Tokyo?") as ResponseType[];

            const lastResponse = responses[responses.length - 1] as StreamResponse;

            expect(lastResponse.messages).toBeDefined();
            expect(lastResponse.messages.length).toBeGreaterThanOrEqual(5); // maybe thinking

            const content = lastResponse.content;
            expect(content).toBeDefined();
            expect(content.length).toBeGreaterThan(0);
            expect(content.toLowerCase()).toContain("sunny");
            expect(content.toLowerCase()).toContain("75");

            expect(seen.thinking).toBe(true);
            expect(seen.content).toBe(true);
            expect(seen.tool_calls).toBe(true);
            expect(seen.tool_result).toBe(true);
        });
    });
});