import { describe, it, expect } from "vitest";
import LLM from "../src/index"

describe("model list", function () {
    it("get models", async function () {
        const models = new LLM([], "openai");

        // expect(models.length).toBeGreaterThan(100);
        // for (const model of models) {
        //     expect(model.service).toBeDefined();
        //     expect(model.model).toBeDefined();
        //     expect(model.model.length).toBeGreaterThan(0);
        //     expect(typeof model.max_tokens).toBe("number");
        //     expect(typeof model.max_input_tokens).toBe("number");
        //     expect(typeof model.max_output_tokens).toBe("number");
        // }
    });
});

// verify connection