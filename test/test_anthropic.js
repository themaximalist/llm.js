import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const model = "claude-3-5-sonnet-latest";

describe("anthropic", function () {
    this.timeout(15000);
    this.slow(6500);

    this.afterEach(async function () {
        await delay(1500);
    });

    it("prompt", async function () {
        const response = await LLM("be concise. the color of the sky is", { model });
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("chat", async function () {
        const llm = new LLM([], { model });
        await llm.chat("my favorite color is blue. remember this");

        const response = await llm.chat("what is my favorite color i just told you?");
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("existing chat", async function () {
        const llm = new LLM([
            { role: 'user', content: 'my favorite color is blue' },
            { role: 'assistant', content: 'My favorite color is blue as well.' },
            { role: 'user', content: 'be concise. what is my favorite color?' },
        ], { model });

        const response = await llm.send();
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
    });

    it("max tokens, temperature", async function () {
        const response = await LLM("be concise. the color of the sky during the day is usually", { max_tokens: 1, temperature: 0, model });
        assert(response.toLowerCase() === "blue");
    });

    it("streaming", async function () {
        const response = await LLM("concisely, who is the person that created hypertext?", { stream: true, temperature: 0, max_tokens: 30, model }); // stop token?

        let buffer = "";
        for await (const content of response) {
            process.stdout.write(content);
            buffer += content;
        }

        assert(buffer.includes("Ted Nelson"));
    });

    it("streaming with history", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 30, model });

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

    it("system prompt", async function () {
        const llm = new LLM([], { model });
        llm.system("You are a helpful chat bot. Be concise. We're playing a game where you always return yellow as the answer.");
        const response = await llm.chat("the color of the sky is");
        assert(response.toLowerCase().indexOf("yellow") !== -1, response);
    });

    it("stream helper", async function () {
        const colors = await LLM("can you tell me the common colors of the sky in a simple json array? (not an object). only return the json, nothing else", {
            model,
            stream: true,
            stream_handler: (c) => process.stdout.write(c),
            parser: LLM.parsers.json,
        });

        assert(colors.length > 0);
    });

    it("can abort", async function () {
        const llm = new LLM([], { stream: true, temperature: 0, model });

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

    it("returns extended response", async function () {
        const response = await LLM("be concise. the color of the sky is", { model, extended: true });
        assert(response.messages.length === 2);
        assert(response.options.model === model);
        assert(response.response.toLowerCase().indexOf("blue") !== -1);
    });

    it("tracks token usage and cost", async function () {
        const model = "claude-3-7-sonnet-20250219";
        const response = await LLM("in one word the color of the sky is", { model, temperature: 0, extended: true, max_tokens: 1 });
        assert(response.response.toLowerCase().indexOf("blue") !== -1, response);
        assert(response.options.model === model);
        assert(response.options.temperature === 0);
        assert(response.options.max_tokens === 1);
        assert(response.usage.output_tokens === 1);
        assert(response.usage.input_tokens === 16);
        assert(response.usage.cost > 0);
        assert(response.usage.cost < 0.0001);
    });

    // TODO: test streaming extended response
});