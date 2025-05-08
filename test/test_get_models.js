import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

describe("get models", function () {
    this.timeout(20_000);
    this.slow(10_000);

// LLM.GOOGLE = GOOGLE;
// LLM.OLLAMA = OLLAMA;
// LLM.GROQ = GROQ;
// LLM.TOGETHER = TOGETHER;
// LLM.PERPLEXITY = PERPLEXITY;
// LLM.DEEPSEEK = DEEPSEEK;

    const services = ["ollama", "anthropic", "openai", "mistral"];
    // const services = ["google"];
    services.forEach(function (service) {
        it(service, async function () {
            const models = await LLM.getLatestModels(service);
            assert(models.length > 0);
            assert(models[0].service === service);
            assert(models[0].model);

            // assure no duplicates
            const modelsSet = new Set(models.map(model => model.model));
            assert(modelsSet.size === models.length);
        });
    });
});