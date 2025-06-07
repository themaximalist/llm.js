import { describe, it, expect } from "vitest";
import LLM from "../src/index"
import { getenv } from "../src/utils.js";
import APIv1 from "../src/APIv1.js";
import type { ServiceName } from "../src/index.js";

class Together extends APIv1 {
    static readonly service: ServiceName = "together";
    static DEFAULT_BASE_URL: string = "https://api.together.xyz/v1";
    static DEFAULT_MODEL: string = "meta-llama/Llama-3-70b-chat-hf";
}

const apiKey = getenv("TOGETHER_API_KEY");

describe("custom", function () {

    it("custom instance", async function () {
        const options = {
            service: "together",
            baseUrl: "https://api.together.xyz/v1",
            model: "meta-llama/Llama-3-70b-chat-hf",
            apiKey,
            max_tokens: 50,
            temperature: 0
        };
        const llm = new LLM(options);
        expect(llm.baseUrl).toBe("https://api.together.xyz/v1");
        expect(llm.model).toBe("meta-llama/Llama-3-70b-chat-hf");
        expect(llm.service).toBe("together");
        expect(llm.apiKey).toBe(apiKey);
        expect(await llm.verifyConnection()).toBe(true);

        const response = await llm.chat("in one word, the color of the sky is usually") as string;
        expect(response.toLowerCase()).toContain("blue");
    });

    it("custom class", async function () {
        const llm = new Together({ max_tokens: 50, temperature: 0 });
        expect(llm.baseUrl).toBe("https://api.together.xyz/v1");
        expect(llm.model).toBe("meta-llama/Llama-3-70b-chat-hf");
        expect(llm.service).toBe("together");
        expect(llm.apiKey).toBe(apiKey);

        expect(await llm.verifyConnection()).toBe(true);

        const response = await llm.chat("in one word, the color of the sky is usually") as string;
        expect(response.toLowerCase()).toContain("blue");
    });

    it("register custom class", async function () {
        let llm = new LLM({ service: "together", max_tokens: 50, temperature: 0 });
        expect(llm.service).toBe("together");
        expect(llm.baseUrl).not.toBe("https://api.together.xyz/v1");

        LLM.register(Together);

        llm = new LLM({ service: "together", max_tokens: 50, temperature: 0 });
        expect(llm.service).toBe("together");
        expect(llm.baseUrl).toBe("https://api.together.xyz/v1");

        LLM.unregister(Together);

        llm = new LLM({ service: "together", max_tokens: 50, temperature: 0 });
        expect(llm.service).toBe("together");
        expect(llm.baseUrl).not.toBe("https://api.together.xyz/v1");

        LLM.register(Together);

        llm = new LLM({ service: "together", max_tokens: 50, temperature: 0 });
        expect(llm.service).toBe("together");
        expect(llm.baseUrl).toBe("https://api.together.xyz/v1");
        expect(llm.apiKey).toBe(apiKey);
        expect(llm.model).toBe("meta-llama/Llama-3-70b-chat-hf");
        expect(await llm.verifyConnection()).toBe(true);

        const response = await llm.chat("in one word, the color of the sky is usually") as string;
        expect(response.toLowerCase()).toContain("blue");
    });
});