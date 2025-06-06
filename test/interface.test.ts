import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama, SERVICES } from "../src/index.js";
import type { Message } from "../src/LLM.types";
import { apiKeys } from "../src/utils.js";
import currentService from "./currentService.js";

describe("LLM Interface", function () {
    it("init default (ollama)", async function () {
        const llm = new LLM();
        expect(llm).toBeInstanceOf(Ollama);
        expect(llm.service).toBe("ollama");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Ollama.DEFAULT_MODEL);
        expect(llm.isLocal).toBe(true);
    });

    SERVICES.forEach(s => {
        const service = s.service;
        if (currentService && service !== currentService) return;

        it(`init (${service})`, async function () {
            const llm = new LLM({ service });
            expect(llm.service).toBe(service);
            expect(llm.model).toBeDefined();
            expect(llm.model.length).toBeGreaterThan(0);
            expect(llm.baseUrl).toBeDefined();
            expect(llm.baseUrl.length).toBeGreaterThan(0);
        });

        it(`messages (${service})`, async function () {
            const message = { role: "user", content: "the color of the sky is usually" };
            const messages = [ message ] as Message[];
            const llm = new LLM(messages, { service });
            expect(llm.messages.length).toBe(1);
            expect(llm.messages[0]).toEqual(message);
        });

        it(`prompt (${service})`, async function () {
            const llm = new LLM("the color of the sky is usually", { service });
            expect(llm.messages.length).toBe(1);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("the color of the sky is usually");
        });

        it(`api key (${service})`, async function () {
            const llm = new LLM({ service, apiKey: "1234" });
            expect(llm.apiKey).toBe("1234");
        });

        it(`env api key (${service})`, async function () {
            const api = apiKeys();
            const llm = new LLM({ service });
            expect(llm.apiKey).toBeDefined();
            expect(llm.apiKey).toBe(api[`${service.toUpperCase()}_API_KEY`]);
        });
    });
});