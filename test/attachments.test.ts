import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

import LLM from "../src/index.js";
import type { Response } from "../src/LLM.types.js";
import currentService from "./currentService.js";

const taco = readFileSync("./test/taco.jpg", "base64");

// document in readme
// all services

// pdf from url
// pdf from buffer

describe("image", function () {
    LLM.services.forEach(s => {
        const service = s.service;

        let max_tokens = 200;
        if (currentService && service !== currentService) return;
        if (service === "google") max_tokens = 5048; // google returns no response if max_tokens is hit!

        it(`${service} base64 image instance`, async function () {
            const tacoAttachment = LLM.Attachment.fromBase64(taco, "image/jpeg");
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

        it(`${service} base64 shorthand`, async function () {
            const tacoAttachment = LLM.Attachment.fromBase64(taco, "image/jpeg");
            const response = await LLM("in one word what is this image?", { service, max_tokens, attachments: [tacoAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("taco");
        });

        it(`${service} base64 stream image`, async function () {
            const tacoAttachment = LLM.Attachment.fromBase64(taco, "image/jpeg");
            expect(tacoAttachment.data).toBe(taco);
            expect(tacoAttachment.contentType).toBe("image/jpeg");

            const llm = new LLM({ service, max_tokens: max_tokens, stream: true });
            const response = await llm.chat("in one word what is this image?", { attachments: [tacoAttachment] }) as AsyncGenerator<string>;
            let buffer = "";
            for await (const chunk of response) {
                buffer += chunk;
            }
            expect(buffer).toBeDefined();
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toLowerCase()).toContain("taco");
        });

        it(`${service} image_url`, async function () {
            const tacoAttachment = LLM.Attachment.fromUrl("https://raw.githubusercontent.com/themaximalist/llm.js/refs/heads/main/test/taco.jpg");
            expect(tacoAttachment.data).toBe("https://raw.githubusercontent.com/themaximalist/llm.js/refs/heads/main/test/taco.jpg");
            expect(tacoAttachment.contentType).toBe("url");

            const llm = new LLM({ service, max_tokens: max_tokens });
            const response = await llm.chat("in one word what is this image?", { attachments: [tacoAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("taco");
        });
    });
});