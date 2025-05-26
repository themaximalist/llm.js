import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

describe("get models", function () {

    const services = ["ollama", "anthropic", "openai", "mistral", "google", "groq", "together", "deepseek", "xai"];
    services.forEach(function (service) {
        it(service, async function () {

            this.timeout(20_000);
            this.slow(10_000);

            const models = await LLM.getLatestModels(service);

            assert(models.length > 0);
            for (const model of models) {
                assert(model.service === service);
                assert(model.model);
                assert(model.created_at);
            }

            // assure no duplicates
            const modelsSet = new Set(models.map(model => model.model));
            assert(modelsSet.size === models.length);
        });
    });
});