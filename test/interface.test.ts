import { describe, it, expect } from "vitest";
import LLM, { Anthropic, Ollama } from "../src/index.js";

// fetch latest model info

describe("LLM Interface", function () {
    it("init defaults (ollama)", async function () {
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

    // download latest model info

    it.only("get model info", async function () {
        const llm = new LLM("the color of the sky is usually");
        console.log(llm.model);
        console.log(llm.modelInfo);

        // expect(llm).toBeInstanceOf(Ollama);
        // expect(llm.service).toBe("ollama");
        // expect(llm.model).toBeDefined();
        // expect(llm.model).toBe(Ollama.DEFAULT_MODEL);
        // expect(llm.baseUrl).toBeDefined();
        // expect(llm.baseUrl).toBe(Ollama.DEFAULT_BASE_URL);
        // expect(llm.messages).toBeDefined();
        // expect(llm.messages.length).toBe(1);
        // expect(llm.messages[0].role).toBe("user");
        // expect(llm.messages[0].content).toBe("the color of the sky is usually");
    });

    // test connections
    // get models

    it.skip("ollama send", async function () {
        const llm = new LLM("the color of the sky is usually");
        const response = await llm.send();
        console.log(response);
        expect(response.toLowerCase()).toContain("blue");
    });

    // it.only("class interface", async function () {
    //     let llm = new LLM("the color of the sky is usually");
    //     expect(llm).toBeInstanceOf(Ollama);
    //     expect(llm.service).toBe("ollama");
    //     const response = await llm.send();
    //     expect(response.toLowerCase()).toContain("blue");

    //     // llm = new LLM("the color of the sky is usually", { service: "anthropic" });
    //     // expect(llm).toBeInstanceOf(Anthropic);
    //     // expect(llm.service).toBe("anthropic");
    //     // const response2 = await llm.send();
    //     // expect(response2.toLowerCase()).toContain("blue");

    // });

    // it("function interface", async function () {
    //     const response = await LLM("the color of the sky is usually");
    //     expect(response.toLowerCase()).toContain("blue");
    // });
});