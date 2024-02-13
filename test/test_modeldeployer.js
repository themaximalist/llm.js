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
            temperature: 0,
            max_tokens: 100,
        };

        it("prompt", async function () {
            const response = await LLM("the color of the sky is usually", options);
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

            const obj = await LLM("in JSON format, the three primary colors are", { ...options, schema });

            assert(obj);
            const keys = Object.keys(obj);
            assert(keys.length == 1);

            const values = obj[keys[0]];
            assert(values.length == 3);
            assert(values.includes("blue"));
        });

        it("custom tool", async function () {
            const tool = {
                "name": "generate_primary_colors",
                "description": "Generates the primary colors",
                "parameters": {
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
            };

            const obj = await LLM("what are the primary colors?", { ...options, tool });
            assert(obj);
            assert(obj.colors);
            assert(obj.colors.length == 3);
            assert(obj.colors.includes("blue"));
        });

    });
});
