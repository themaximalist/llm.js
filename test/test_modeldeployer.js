import assert from "assert";
import LLM from "../src/index.js";

describe.only("modeldeployer", function () {
    this.timeout(10000);
    this.slow(5000);

    describe("llamafile", function () {
        const model = "modeldeployer/llamafile";

        it("prompt", async function () {
            const response = await LLM("the color of the sky is", { model, temperature: 0 });
            assert(response.indexOf("blue") !== -1, response);
        });

        it("chat", async function () {
            const llm = new LLM([], { model });
            await llm.chat("my favorite color is blue. remember this");

            const response = await llm.chat("what is my favorite color i just told you?");
            assert(response.indexOf("blue") !== -1, response);
        });

        it("existing chat", async function () {
            const llm = new LLM([
                { role: 'user', content: 'my favorite color is blue. remember it.' },
                { role: 'assistant', content: 'My favorite color is blue as well.' },
                { role: 'user', content: 'what is my favorite color that i just told you?' },
            ], { model, temperature: 0 });

            const response = await llm.send();
            assert(response.indexOf("blue") !== -1, response);
        });

        it("max tokens, temperature, seed", async function () {
            const response = await LLM("the color of the sky during the day is usually", { max_tokens: 1, temperature: 0, seed: 10000, model });
            assert(response.indexOf("blue") !== -1, response);
        });

        it("json format", async function () {
            const schema = {
                "type": "object",
                "properties": {
                    "colors": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "required": ["colors"]
            }

            const obj = await LLM("what are the 3 primary colors in JSON format?", { schema, temperature: 0.1, model });
            assert(obj.colors);
            assert(obj.colors.length == 3);
            assert(obj.colors.includes("blue"));
        });


        it.only("streaming", async function () {
            const response = await LLM("who created hypertext?", { stream: true, temperature: 0, max_tokens: 30, model }); // stop token?

            let buffer = "";
            for await (const content of response) {
                buffer += content;
            }

            assert(buffer.includes("Ted Nelson"));
        });

        it("streaming with history", async function () {
            const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 30, model });

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
    });
});