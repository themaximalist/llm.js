export type AttachmentType = "image" | "document";

export default class Attachment {
    public data: string;
    public type: AttachmentType;
    public contentType: string;

    constructor(data: string, type: AttachmentType, contentType: string) {
        this.data = data;
        this.type = type;
        this.contentType = contentType;
    }

    get isImage() {
        return this.type === "image";
    }

    get isDocument() {
        return this.type === "document";
    }

    get isURL() {
        return this.contentType === "url";
    }

    get content() {
        return { type: this.type, source: this.source }
    }

    get source() {
        if (this.contentType === "url") {
            return { type: "url", url: this.data }
        } else {
            return { type: "base64", media_type: this.contentType, data: this.data }
        }
    }

    static fromBase64(data: string, type: AttachmentType, contentType: string) {
        return new Attachment(data, type, contentType);
    }

    static fromJPEG(data: string) {
        return new Attachment(data, "image", "image/jpeg");
    }

    static fromPNG(data: string) {
        return new Attachment(data, "image", "image/png");
    }

    static fromGIF(data: string) {
        return new Attachment(data, "image", "image/gif");
    }

    static fromWEBP(data: string) {
        return new Attachment(data, "image", "image/webp");
    }

    static fromSVG(data: string) {
        return new Attachment(data, "image", "image/svg+xml");
    }

    static fromTIFF(data: string) {
        return new Attachment(data, "image", "image/tiff");
    }

    static fromPDF(data: string) {
        return new Attachment(data, "document", "application/pdf");
    }

    static fromImageURL(url: string) {
        return new Attachment(url, "image", "url");
    }

    static fromDocumentURL(url: string) {
        return new Attachment(url, "document", "url");
    }
}
