import "dotenv-extended/config.js"
import assert from "assert"

import LLM from "../src/index.js"

describe("modeldeployer", function () {
    this.timeout(10000);
    this.slow(5000);

    describe("openai", function () {
        const options = {
            service: "modeldeployer",
            model: process.env.MODELDEPLOYER_API_KEY,
            endpoint: process.env.MODELDEPLOYER_ENDPOINT,
        };

        it("prompt", async function () {
            const response = await LLM("the color of the sky is", options);
            assert(response.indexOf("blue") !== -1, response);
        });

        it("json schema", async function () {
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

            const obj = await LLM("what are the 3 primary colors?", { ...options, schema });
            assert(obj);
            assert(obj.colors);
            assert(obj.colors.length == 3);
            assert(obj.colors.includes("blue"));
        });

    });
});
