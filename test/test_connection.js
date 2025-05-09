import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

describe("test connection", function () {
    const services = ["ollama", "llamafile", "anthropic", "openai", "mistral", "google", "groq", "together", "deepseek", "xai"];
    services.forEach(function (service) {
        it(service, async function () {
            this.timeout(20_000);
            this.slow(10_000);

            const result = await LLM.testConnection(service);
            assert(result);
        });
    });
});