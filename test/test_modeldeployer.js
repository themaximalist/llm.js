import assert from "assert";
import LLM from "../src/index.js";

// largely a duplicate of the other three modules, this works with modeldeployer which in turn works with llm.js

describe("modeldeployer", function () {
    this.timeout(10000);
    this.slow(5000);

    describe("openai", function () {
        // const model = "modeldeployer://761c4c32-cfb0-4fd7-9ee5-fabb8df6e6d4"; // gpt-3.5-turbo
        const model = "modeldeployer://63d253c6-52d6-4464-a9e3-95c041c7b315"; // claude
        const endpoint = "https://modeldeployer.com/api/v1/chat";

        it.only("prompt", async function () {
            const response = await LLM("the color of the sky is", { model, endpoint, max_tokens: 30 });
            assert(response.indexOf("blue") !== -1, response);
        });

    });
});
