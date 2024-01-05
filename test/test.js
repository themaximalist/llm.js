import assert from "assert";
import LLM from "../src/index.js";

describe("llamafile", function () {
    this.timeout(6000);
    this.slow(2500);

    it("prompt", async function () {
        const response = await LLM("the color of the sky is");
        assert(response.indexOf("blue") !== -1, response);
    });

    it("chat", async function () {
        const llm = new LLM();
        await llm.chat("my favorite color is blue");

        const response = await llm.chat("what is my favorite color?");
        assert(response.indexOf("blue") !== -1, response);
    });

    it("existing chat", async function () {
        const llm = new LLM([
            { role: 'user', content: 'my favorite color is blue' },
            { role: 'assistant', content: 'My favorite color is blue as well.' },
            { role: 'user', content: 'what is my favorite color?' },
        ]);

        const response = await llm.send();
        assert(response.indexOf("blue") !== -1, response);
    });

    it("max tokens, temperature, seed", async function () {
        const response = await LLM("what color is the sky?", { max_tokens: 10, temperature: 0, seed: 10000 });
        assert(response.indexOf("blue") !== -1, response);
    });

    it("json format", async function () {
        const schema = {
            "type": "array",
            "items": {
                "type": "string"
            }
        };

        const colors = await LLM("reply in JSON format with a list of names of the 3 primary colors", { schema, temperature: 0 });
        assert(colors.length === 3, colors);
        assert(colors.includes("Red"), colors);
        assert(colors.includes("Green"), colors);
        assert(colors.includes("Blue"), colors);
    });


    it("streaming", async function () {
        const response = await LLM("who created hypertext?", { stream: true, temperature: 0, max_tokens: 30 }); // stop token?

        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }

        assert(buffer.includes("Ted Nelson"));
    });

    it("streaming with history", async function () {
        const llm = new LLM();

        const options = { stream: true, temperature: 0, max_tokens: 30 };

        let response = await llm.chat("double this number: 25", options);
        for await (const content of response) {
        }

        response = await llm.chat("repeat your last message", options);
        let buffer = "";
        for await (const content of response) {
            buffer += content;
        }

        assert(buffer.includes("50"));
        assert(buffer.includes("100"));
    });
});