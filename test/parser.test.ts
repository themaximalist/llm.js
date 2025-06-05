import { describe, it, expect } from "vitest";
import * as parsers from "../src/parsers";
import LLM, { SERVICES } from "../src/index.js";
import type { Options, PartialStreamResponse } from "../src/LLM.types.js";
import currentService from "./currentService.js";

describe("parsers", function () {
    it("json", function () {
        expect(parsers.json('{"a": 1}')).toEqual({ a: 1 });
        expect(parsers.json("\`\`\`json\n{\n  \"a\": 1\n}\n\`\`\`")).toEqual({ a: 1 });
    });

    it("markdown", function () {
        expect(parsers.codeBlock("markdown")("```markdown\n# Hello\n```")).toEqual("# Hello");
    });

    it("xml", function () {
        expect(parsers.xml("a")("<a>1</a>")).toEqual("1");
        expect(parsers.xml("thinking")("<thinking>1, 2, 3</thinking>")).toEqual("1, 2, 3");
    });

    SERVICES.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(`${service} chat json`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, json: true } as Options;
            if (service === "groq") options.model = "llama-3.1-8b-instant";
            const response = await LLM(`return a JSON object in the form of {"color": "..."} containing the color of the sky`, options) as any;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.color.toLowerCase()).toContain("blue");
        });

        it(`${service} chat extended json`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, json: true, extended: true } as Options;
            if (service === "groq") options.model = "llama-3.1-8b-instant";
            const response = await LLM(`return a JSON object in the form of {"color": "..."} containing the color of the sky`, options) as any;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.content).toBeDefined();
            expect(response.content).toBeInstanceOf(Object);
            expect(response.content.color.toLowerCase()).toContain("blue");
        });

        it(`${service} chat markdown`, async function () {
            const options = { max_tokens: 100, service, temperature: 0, parser: LLM.parsers.markdown } as Options;
            if (service === "groq") options.model = "llama-3.1-8b-instant";
            const response = await LLM("return a markdown code block containing the color of the sky", options) as string;
            expect(response).toBeDefined();
            expect(response).toBeTypeOf("string");
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("blue");
        });

        it(`${service} stream json`, async function () {
            const options = { stream: true, service, max_tokens: 50, json: true, extended: true } as any;
            if (options.service === "groq") options.max_tokens = 1024; // thinking
            const prompt = "keep it short, the color of the sky is usually, return a JSON object in the form of {color: '...'}";
            const response = await LLM(prompt, options) as unknown as PartialStreamResponse;

            for await (const chunk of response.stream) {}

            const completed = await response.complete();

            expect(completed).toBeDefined();
            const content = completed.content as any;
            expect(content).toBeDefined();
            expect(content).toBeInstanceOf(Object);
            expect(content.color.toLowerCase()).toContain("blue");
        });
    });
});