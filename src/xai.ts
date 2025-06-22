import type { ServiceName, Options } from "./LLM.types";
import APIv1 from "./APIv1";
import Attachment from "./Attachment";

/**
 * @category LLMs
 */
export default class xAI extends APIv1 {
    static readonly service: ServiceName = "xai";
    static DEFAULT_BASE_URL: string = "https://api.x.ai/v1/";
    static DEFAULT_MODEL: string = "grok-3";

    parseAttachment(attachment: Attachment) {
        if (attachment.isImage) {
            if (attachment.isURL) {
                return { type: "image_url", image_url: { url: attachment.data, detail: "high" } }
            } else {
                return { type: "image_url", image_url: { url: `data:${attachment.contentType};base64,${attachment.data}`, detail: "high" } }
            }
        }

        throw new Error("Unsupported attachment type");
    }
}
