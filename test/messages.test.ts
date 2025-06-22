import { describe, it, expect } from "vitest";
import type { Message } from "../src/LLM.types.js";
import type { GoogleMessage } from "../src/google.js";
import LLM from "../src/index.js";

describe("messages", function () {
  describe("google", function () {
    it("text input", function () {
        const message = { role: "user", content: "Hello World" } as Message;
        const googleMessage = LLM.Google.toGoogleMessage(message);
        expect(googleMessage).toEqual({ role: "user", parts: [{ text: "Hello World" }] });
    });

    it("text output", function () {
        const googleMessage = { role: "user", parts: [{ text: "Hello World" }] } as GoogleMessage;
        const message = LLM.Google.fromGoogleMessage(googleMessage);
        expect(message).toEqual({ role: "user", content: "Hello World" });
    });

    it("image input", function () {
        const message = { role: "user", content: { text: "Hello World", attachments: [{ type: "image", contentType: "image/jpeg", data: "base64" }] } } as Message;
        const googleMessage = LLM.Google.toGoogleMessage(message);
        expect(googleMessage).toEqual({ role: "user", parts: [{ inline_data: { mime_type: "image/jpeg", data: "base64" } }, { text: "Hello World" }] });
    });

    it("image output", function () {
        const googleMessage = { role: "user", parts: [{ inline_data: { mime_type: "image/jpeg", data: "base64" } }, { text: "Hello World" }] } as GoogleMessage;
        const message = LLM.Google.fromGoogleMessage(googleMessage);
        expect(message).toEqual({ role: "user", content: { text: "Hello World", attachments: [{ type: "image", contentType: "image/jpeg", data: "base64" }] } });
    });
  });
});