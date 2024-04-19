import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const service = "together";
// const model = "meta-llama/Llama-3-70b-chat-hf";
const model = "meta-llama/Llama-3-8b-chat-hf";

describe("together", function () {
    this.timeout(100000);
    this.slow(5000);

    this.afterEach(async function () {
        await delay(2500);
    });

    it("prompt", async function () {
        const response = await LLM("in a word, the color of the sky is", { service, model });
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
            { role: 'user', content: 'my favorite color is blue. remember it.' },
            { role: 'assistant', content: 'My favorite color is blue as well.' },
            { role: 'user', content: 'what is my favorite color that i just told you?' },
        ], { model, temperature: 0, service });

        const response = await llm.send();
        assert(response.indexOf("blue") !== -1, response);
    });

    it("max tokens, temperature", async function () {
        const response = await LLM("the color of the sky during the day is usually", { max_tokens: 100, temperature: 0, model, service });
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("streaming", async function () {
        const response = await LLM("who created hypertext?", { stream: true, temperature: 0, max_tokens: 30, model, service });

        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }

        assert(buffer.includes("Ted Nelson"));
    });

    it("streaming with history", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 50, model, service });

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

    it("long stream response (regression)", async function () {
        this.timeout(60000);
        const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 1000, model, service });

        const response = await llm.chat("tell me a long story");
        let buffer = "";
        for await (const content of response) {
            process.stdout.write(content);
            buffer += content;
        }

        assert(buffer.length > 900, buffer.length);
    });

    it("can abort", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, model, service });

        let response = await llm.chat("tell me a long story");
        setTimeout(() => llm.abort(), 700);
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