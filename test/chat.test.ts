import { describe, it, expect } from "vitest";
import LLM from "../src/index.js";

describe("chat", function () {
    const services = ["ollama", "anthropic"];
    services.forEach(service => {
        it.only(service, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: 1 });
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toEqual("blue");
        });
    });
});