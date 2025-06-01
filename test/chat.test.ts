import { describe, it, expect } from "vitest";
import LLM, { SERVICES } from "../src/index.js";

// SERVICES.shift();

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


        it.skip(`${service} extended`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: 1, service, extended: true });
            const response = await llm.send();
            console.log(response);
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);

            // expect(llm.messages.length).toBe(2);
            // expect(llm.messages[0].role).toBe("user");
            // expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            // expect(llm.messages[1].role).toBe("assistant");
            // expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

    });
});

// todo: test thinking

// todo: thinking automatically shifts to extended mode

// send / chat level options and overrides