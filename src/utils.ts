export async function handleErrorResponse(response: Response, error="Error while handling response") {
    if (response.ok) return true;
    const data = await response.json();
    if (!data) throw new Error(error);
    throw new Error(`${data.error.type}: ${data.error.message}`);
}

export async function *parseStream(stream: ReadableStream) : AsyncGenerator<any> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        let { done, value } = await reader.read();

        let jsonchunk = decoder.decode(value, { stream: true });
        if (!jsonchunk) continue;

        const jsonlines = jsonchunk.split("\n");
        let unparsedLines: string[] = [];

        for (let jsonline of jsonlines) {
            if (jsonline.startsWith("event: ")) continue;
            if (jsonline.startsWith("data: ")) jsonline = jsonline.slice(6);
            if (jsonline.length === 0) continue;
            unparsedLines.push(jsonline);
        }

        buffer = unparsedLines.join("\n");
        unparsedLines = [];

        const lines = buffer.split("\n");
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                yield data;
                if (data.type === "message_stop" || data.done) done = true;
            } catch (e) {
                unparsedLines.push(line);
            }
        }

        buffer = unparsedLines.join("\n");

        if (done) {
            if (buffer.length > 0) {
                try {
                    const data = JSON.parse(buffer);
                    yield data;
                } catch (e) {
                    console.error("Error parsing JSON LINE:", buffer);
                }
            }

            break;
        }
    }
}