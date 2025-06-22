export default class Attachment {
    public data: string;
    public contentType: string;

    constructor(data: string, contentType: string) {
        this.data = data;
        this.contentType = contentType;
    }
}