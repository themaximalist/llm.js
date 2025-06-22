export default class Attachment {
    public data: string;
    public contentType: string;

    constructor(data: string, contentType: string) {
        this.data = data;
        this.contentType = contentType;
    }

    static fromBase64(data: string, contentType: string) {
        return new Attachment(data, contentType);
    }

    static fromUrl(url: string) {
        return new Attachment(url, "url");
    }
}
