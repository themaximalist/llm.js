import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";

import LLM from "../src/index.js";
import type { Response } from "../src/LLM.types.js";
import currentService from "./currentService.js";

const taco = readFileSync("./test/taco.jpg", "base64");
const tacoAttachment = LLM.Attachment.fromJPEG(taco);

const dummy = readFileSync("./test/dummy.pdf", "base64");
const dummyAttachment = LLM.Attachment.fromPDF(dummy);


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
            expect(tacoAttachment.data).toBe(taco);
            expect(tacoAttachment.contentType).toBe("image/jpeg");
            expect(tacoAttachment.isImage).toBe(true);

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
            const response = await LLM("in one word what is this image?", { service, max_tokens, attachments: [tacoAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("taco");
        });

        it(`${service} base64 stream image`, async function () {
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

        it(`${service} image url`, async function () {
            const tacoAttachment = LLM.Attachment.fromImageURL("https://raw.githubusercontent.com/themaximalist/llm.js/refs/heads/main/test/taco.jpg");
            const llm = new LLM({ service, max_tokens: max_tokens });
            const response = await llm.chat("in one word what is this image?", { attachments: [tacoAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("taco");
        });

        it(`${service} pdf base64`, async function () {
            expect(dummyAttachment.isDocument).toBe(true);
            const llm = new LLM({ service, max_tokens: max_tokens });
            const response = await llm.chat("please return the first 50 characters of the pdf", { attachments: [dummyAttachment] }) as string;
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("dummy");
        });

        it(`${service} pdf url`, async function () {
            const dummyAttachment = LLM.Attachment.fromDocumentURL("https://raw.githubusercontent.com/themaximalist/llm.js/refs/heads/main/test/dummy.pdf");
            const llm = new LLM({ service, max_tokens: max_tokens });
            const response = await llm.chat("please return the first 50 characters of the pdf", { attachments: [dummyAttachment] }) as string; 
            expect(response).toBeDefined();
            expect(response.length).toBeGreaterThan(0);
            expect(response.toLowerCase()).toContain("dummy");
        });
    });
});