import assert from "assert";
import LLM from "../src/index.js";

const overrides = {
    "grok/experimental-model": {
        "max_tokens": 131072,
        "max_input_tokens": 131072,
        "max_output_tokens": 131072,
        "input_cost_per_token": 0.000003,
        "output_cost_per_token": 0.000015,
        "litellm_provider": "xai",
        "mode": "chat",
        "supports_function_calling": true,
        "supports_tool_choice": true
    }
};


describe("price override", function () {
    this.timeout(5000);
    this.slow(3000);

    it("get known price", async function () {
        const prompt = "Hello World";
        const estimated_tokens = LLM.estimateTokens(prompt);

        assert(estimated_tokens === 2);
        assert(estimated_tokens < prompt.length);

        const { cost } = LLM.costForModelTokens("openai", "gpt-4o", estimated_tokens, 0);
        assert(cost > 0, cost);
        assert(cost < 0.001);
    });

    it("get unknown price", async function () {
        const prompt = "Hello World";
        const estimated_tokens = LLM.estimateTokens(prompt);

        assert(estimated_tokens === 2);
        assert(estimated_tokens < prompt.length);

        const { cost } = LLM.costForModelTokens("grok", "experimental-model", estimated_tokens, 0);
        assert(isNaN(cost));
    });

    it("get price override", async function () {
        const prompt = "Hello World";

        const estimated_tokens = LLM.estimateTokens(prompt);

        assert(estimated_tokens === 2);
        assert(estimated_tokens < prompt.length);

        const { cost } = LLM.costForModelTokens("grok", "experimental-model", estimated_tokens, 0, overrides);
        assert(!isNaN(cost));
        assert(cost > 0, cost);
        assert(cost < 0.001);
    });

    it("get price override on instance", async function () {
        const prompt = "Hello World";
        const llm = new LLM(prompt, { overrides, model: "experimental-model", service: "grok" });
        const estimated_tokens = llm.estimateTokens();

        assert(estimated_tokens === 2);
        assert(estimated_tokens < prompt.length);

        const estimated_cost = llm.estimateCost(estimated_tokens, 0);
        assert(!isNaN(estimated_cost.cost));
        assert(estimated_cost.cost > 0, estimated_cost.cost);
        assert(estimated_cost.cost < 0.001);
    });
});
