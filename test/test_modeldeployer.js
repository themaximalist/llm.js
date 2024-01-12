import "dotenv-extended/config.js"
import assert from "assert"

import LLM from "../src/index.js"

describe("modeldeployer", function () {
    this.timeout(10000);
    this.slow(5000);

    describe("openai", function () {
        it("prompt", async function () {
            const options = {
                service: "modeldeployer",
                model: process.env.MODELDEPLOYER_API_KEY,
                endpoint: process.env.MODELDEPLOYER_ENDPOINT,
                max_tokens: 30,
            };

            const response = await LLM("the color of the sky is", options);
            assert(response.indexOf("blue") !== -1, response);
        });

    });
});
