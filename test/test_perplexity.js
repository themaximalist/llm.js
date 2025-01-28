import assert from "assert";
import LLM from "../src/index.js";

const service = "perplexity";

describe("perplexity", function () {
    this.timeout(10000);
    this.slow(5000);

    it("prompt", async function () {
        const response = await LLM("the color of the sky is", { service });
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("chat", async function () {
        const llm = new LLM([], { service });
        await llm.chat("my favorite color is blue. remember this");

        const response = await llm.chat("what is my favorite color i just told you?");
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("existing chat", async function () {
        const llm = new LLM([
            { role: 'user', content: 'my favorite color is blue. remember it.' },
            { role: 'assistant', content: 'My favorite color is blue as well.' },
            { role: 'user', content: 'what is my favorite color that i just told you?' },
        ], { service, temperature: 0 });

        const response = await llm.send();
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("max tokens, temperature", async function () {
        const response = await LLM("the color of the sky during the day is usually", { max_tokens: 100, temperature: 0, service });
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    // TODO: perplexity is not returning good results right now...maybe because of formatting?
    it.skip("streaming", async function () {
        this.timeout(20000);
        this.slow(10000);
        const model = "sonar-pro";
        const response = await LLM("who coined the term hypertext?", { stream: true, temperature: 1, max_tokens: 1000, service, model }); // stop token?

        let buffer = "";
        let found = false;
        for await (const content of response) {
            buffer += content;
            if (buffer.toLowerCase().includes("ted nelson")) {
                found = true;
                break;
            }
        }

        assert(found, buffer);
    });

    // TODO: perplexity is not returning good results right now...maybe because of formatting?
    it.skip("streaming with history", async function () {
        this.timeout(40000);
        this.slow(20000);
        const model = "llama-3.1-sonar-large-128k-online";
        const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 500, service, model });

        let response = await llm.chat("My favorite color is blue. Remember that.");
        for await (const content of response) {
        }

        response = await llm.chat("what is my favorite color?");
        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }

        assert(buffer.toLowerCase().includes("blue"));
    });
});