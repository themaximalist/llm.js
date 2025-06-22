import { describe, it, expect } from "vitest";
import LLM from "../src/index.js";
import type { Response } from "../src/LLM.types.js";
import currentService from "./currentService.js";

const taco = `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`;

// read from file & attach

// document in readme
// pdf / remote vs local
// image

/*

  {
    "type": "image",
    "source": {
      "type": "base64",
      "media_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRg...",
    }

{
             "type": "document",
             "source": {
                 "type": "url",
                 "url": "https://assets.anthropic.com/m/1cd9d098ac3e6467/original/Claude-3-Model-Card-October-Addendum.pdf"
             }
         },
         


                "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": $PDF_BASE64
            }

*/

// llm shorthand
// llm instance
// stream
// message history
// image from file
// image from url
// pdf from file
// pdf from url

describe("image", function () {
    LLM.services.forEach(s => {
        const service = s.service;

        let max_tokens = 200;
        if (currentService && service !== currentService) return;
        if (service === "google") max_tokens = 5048; // google returns no response if max_tokens is hit!

        it.only(`${service} base64 image instance`, async function () {
            const tacoAttachment = new LLM.Attachment(taco, "image/jpeg");
            expect(tacoAttachment.data).toBe(taco);
            expect(tacoAttachment.contentType).toBe("image/jpeg");

            const llm = new LLM({ service, max_tokens: max_tokens });
            const response = await llm.chat("in one word what is this image?", { attachments: [tacoAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("taco");
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].content.attachments).toBeDefined();
            expect(llm.messages[0].content.attachments.length).toBe(1);

            const response2 = await llm.chat("what is the color of the shell?") as string;
            expect(response2).toBeDefined();
            expect(response2.length).toBeGreaterThan(0);
            expect(response2.toLowerCase()).toContain("yellow");
            expect(llm.messages.length).toBe(4);
        });

        /*
        it(`${service} instance`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service });
            const response = await llm.send();
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} instance chat`, async function () {
            const llm = new LLM({ max_tokens, service });
            const response = await llm.chat("in one word the color of the sky is usually");
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
        });

        it(`${service} settings override`, async function () {
            const llm = new LLM({ service });
            const response = await llm.chat("the color of the sky is usually", { max_tokens: max_tokens });
            expect(response).toBeDefined();
            expect(llm.messages.length).toBe(2);
            expect(llm.messages[0].role).toBe("user");
            expect(llm.messages[0].content).toBe("the color of the sky is usually");
            expect(llm.messages[1].role).toBe("assistant");
            expect(llm.messages[1].content.toLowerCase()).toContain("blue");
            expect(llm.messages[1].content.length).toBeGreaterThan(3);
        });


        it(`${service} extended`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, extended: true });
            const response = await llm.send() as Response;
            expect(response).toBeDefined();
            expect(response).toBeInstanceOf(Object);
            expect(response.service).toBe(service);
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.max_tokens).toBe(max_tokens);
            expect(response.messages.length).toBe(2);
            expect(response.messages[0].role).toBe("user");
            expect(response.messages[0].content).toBe("in one word the color of the sky is usually");
            expect(response.messages[1].role).toBe("assistant");
            expect(response.messages[1].content.toLowerCase()).toContain("blue");
            expect(response.usage.input_tokens).toBeGreaterThan(0);
            expect(response.usage.output_tokens).toBeGreaterThan(0);
            expect(response.usage.total_tokens).toBe(response.usage.input_tokens + response.usage.output_tokens);
            expect(response.usage.local).toBe(llm.isLocal);
            if (llm.isLocal) {
                expect(response.usage.input_cost).toBe(0);
                expect(response.usage.output_cost).toBe(0);
                expect(response.usage.total_cost).toBe(0);
            } else {
                expect(response.usage.input_cost).toBeGreaterThan(0);
                expect(response.usage.output_cost).toBeGreaterThan(0);
                expect(response.usage.total_cost).toBeGreaterThan(0);
            }
        });

        it(`${service} abort`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service });
            return new Promise((resolve, reject) => {
                llm.send().then(() => {
                    resolve(false);
                }).catch((e: any) => {
                    expect(e.name).toBe("AbortError");
                    resolve(true);
                });

                setTimeout(() => { llm.abort() }, 50);
            });
        });

        it(`${service} temperature`, async function () {
            const response = await LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, temperature: 1, extended: true }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(1);
        });

        it(`${service} temperature override`, async function () {
            const llm = new LLM("in one word the color of the sky is usually", { max_tokens: max_tokens, service, temperature: 0, extended: true });
            const response = await llm.send({ temperature: 1 }) as unknown as Response;
            expect(response).toBeDefined();
            expect(response.content).toBeDefined();
            expect(response.content.length).toBeGreaterThan(0);
            expect(response.content.toLowerCase()).toContain("blue");
            expect(response.options).toBeDefined();
            expect(response.options.temperature).toBe(1);
        });
    });

    it(`anthropic max_thinking_tokens`, async function () {
        if (currentService && (currentService as string) !== "anthropic") return;
        const service = "anthropic";
        const options = { max_tokens: 5048, max_thinking_tokens: 1025, service, think: true, model: "claude-opus-4-20250514" } as any;
        const response = await LLM("in one word the color of the sky is usually", options) as unknown as Response;
        expect(response).toBeDefined();
        expect(response.options.think).toBe(true);
        expect(response.options.max_thinking_tokens).toBe(1025);
        expect(response.thinking).toBeDefined();
        expect(response.thinking!.length).toBeGreaterThan(0);
        expect(response.thinking!.toLowerCase()).toContain("blue");
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.content.toLowerCase()).toContain("blue");
    });
    */
    });
});