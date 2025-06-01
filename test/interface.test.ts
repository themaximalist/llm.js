import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama, type Message } from "../src/index.js";

describe("LLM Interface", function () {
    it("init default (ollama)", async function () {
        const llm = new LLM();
        expect(llm).toBeInstanceOf(Ollama);
        expect(llm.service).toBe("ollama");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Ollama.DEFAULT_MODEL);
        expect(llm.isLocal).toBe(true);
    });

    it("init options service (ollama)", async function () {
        const llm = new LLM({ service: "ollama" });
        expect(llm).toBeInstanceOf(Ollama);
        expect(llm.service).toBe("ollama");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Ollama.DEFAULT_MODEL);
    });

    it("init options service (anthropic)", async function () {
        const llm = new LLM({ service: "anthropic" });
        expect(llm).toBeInstanceOf(Anthropic);
        expect(llm.service).toBe("anthropic");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Anthropic.DEFAULT_MODEL);
        expect(llm.isLocal).toBe(false);
    });

    it("init messages", async function () {
        const message = { role: "user", content: "the color of the sky is usually" };
        const messages = [ message ] as Message[];
        const llm = new LLM(messages);
        expect(llm.messages.length).toBe(1);
        expect(llm.messages[0]).toEqual(message);
    });

    it("init prompt (ollama)", async function () {
        const llm = new LLM("the color of the sky is usually");
        expect(llm).toBeInstanceOf(Ollama);
        expect(llm.service).toBe("ollama");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Ollama.DEFAULT_MODEL);
        expect(llm.baseUrl).toBeDefined();
        expect(llm.baseUrl).toBe(Ollama.DEFAULT_BASE_URL);
        expect(llm.messages).toBeDefined();
        expect(llm.messages.length).toBe(1);
        expect(llm.messages[0].role).toBe("user");
        expect(llm.messages[0].content).toBe("the color of the sky is usually");
    });

    it("init anthropic", async function () {
        const llm = new LLM("the color of the sky is usually", { service: "anthropic" });
        expect(llm).toBeInstanceOf(Anthropic);
        expect(llm.service).toBe("anthropic");
        expect(llm.model).toBeDefined();
        expect(llm.model).toBe(Anthropic.DEFAULT_MODEL);
        expect(llm.baseUrl).toBeDefined();
        expect(llm.baseUrl).toBe(Anthropic.DEFAULT_BASE_URL);
        expect(llm.messages).toBeDefined();
        expect(llm.messages.length).toBe(1);
        expect(llm.messages[0].role).toBe("user");
        expect(llm.messages[0].content).toBe("the color of the sky is usually");
    });

    it("api key param", async function () {
        const llm = new LLM({ service: "anthropic", apiKey: "1234" });
        expect(llm).toBeInstanceOf(Anthropic);
        expect(llm.apiKey).toBe("1234");
    });

    it("api key from env", async function () {
        const llm = new LLM({ service: "anthropic" });
        expect(llm.apiKey).toBeDefined();
        expect(llm.apiKey).toBe(process.env.ANTHROPIC_API_KEY);
    });
});