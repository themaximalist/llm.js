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
            const responses = await agent.run("what is the weather in Tokyo?") as Response[];
            expect(responses).toBeDefined();
            expect(responses.length).toBe(2);
            expect(responses[1].content).toBeDefined();
            expect(responses[1].content.length).toBeGreaterThan(0);
            expect(responses[1].content.toLowerCase()).toContain("sunny");
            expect(responses[1].content.toLowerCase()).toContain("75");
        });

        it.skip(`${service} stream`, async function () {
            function get_current_weather({ city }: { city: string }) {
                return `The weather in ${city} is sunny and 75 degrees`;
            }

            get_current_weather.description = "Get the current weather for a city";
            get_current_weather.input_schema = { type: "object", properties: { city: { type: "string", description: "The name of the city" } }, required: ["city"] };

            const options = { max_tokens: 256, service, tools: [get_current_weather], stream: true } as Options;
            if (service === "ollama") options.model = "gpt-oss:20b";
            const agent = new LLM(options);
            const response = await agent.run("what is the weather in Tokyo?") as PartialStreamResponse;

            let content = "";
            for await (const chunk of response.stream) {
                if (typeof chunk === "object" && chunk.type === "content") content += chunk.content;
            }

            console.log(content);

            expect(content).toBeDefined();
            expect(content.length).toBeGreaterThan(0);
            expect(content.toLowerCase()).toContain("sunny");
            expect(content.toLowerCase()).toContain("75");
        });
    });
});