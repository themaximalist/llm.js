import assert from "assert";
import LLM from "../src/index.js";

const service = "ollama";
const model = "llama3-gradient";

describe("ollama", function () {
    this.timeout(10000);
    this.slow(5000);

    it("prompt", async function () {
        const response = await LLM("be concise. the color of the sky is", { model, service, temperature: 0, max_tokens: 30 });
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("chat", async function () {
        const llm = new LLM([], { model, service });
        await llm.chat("my favorite color is blue. remember this");

        const response = await llm.chat("what is my favorite color i just told you?");
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("existing chat", async function () {
        const llm = new LLM([
            { role: 'user', content: 'my favorite color is blue' },
            { role: 'assistant', content: 'My favorite color is blue as well.' },
            { role: 'user', content: 'be concise. what is my favorite color?' },
        ], { model, service });

        const response = await llm.send();
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("max tokens, temperature, seed", async function () {
        const response = await LLM("be concise. the color of the sky during the day is usually", { max_tokens: 1, temperature: 0, seed: 10000, model, service });
        assert(response.toLowerCase() === "blue");
    });

    it("streaming", async function () {
        const response = await LLM("who created the hypertext specification?", { stream: true, temperature: 0, max_tokens: 30, model, service }); // stop token?

        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }

        assert(buffer.includes("Tim Berners-Lee"));
    });

    it("streaming with history", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 80, model, service });

        let response = await llm.chat("double this number: 25");
        for await (const content of response) {
        }

        response = await llm.chat("repeat your last message");
        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }
        assert(buffer.includes("50"));
    });

    it("system prompt", async function () {
        const llm = new LLM([], { model, service });
        llm.system("You are a helpful chat bot. Be concise. We're playing a game where you always return yellow as the answer.");
        const response = await llm.chat("the color of the sky is");
        assert(response.toLowerCase().indexOf("yellow") !== -1, response);
    });

    it("can abort", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, model, service });

        let response = await llm.chat("tell me a long story");
        setTimeout(() => llm.abort(), 1000);
        let buffer = "";
        try {
            for await (const content of response) {
                buffer += content;
            }

            assert.fail("Expected to abort");
        } catch (err) {
            assert(err.name === "AbortError");
        }

        assert(buffer.length > 0);
    });
});
