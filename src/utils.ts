import logger from "./logger";
import type { Message, MessageRole, Tool, ToolCall, WrappedTool, WrappedToolCall } from "./LLM.types";

const log = logger("LLM:utils");

export async function handleErrorResponse(response: Response, error="Error while handling response") {
    if (response.ok) return true;
    let data;
    try {
        data = await response.json();
    } catch (e) {
        let err = "Unable to parse response";
        if (response.status && response.statusText) {
            err = `${response.status} ${response.statusText}`;
        }

        throw new Error(err);
    }

    let err = error;
    if (data.error && typeof data.error === "string") {
        err = data.error;
    } else if (data.error && typeof data.error === "object" && data.error.type && data.error.message) {
        err = `${data.error.type}: ${data.error.message}`;
    }

    throw new Error(err);
}

export async function *parseStream(stream: ReadableStream) : AsyncGenerator<any> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    let done = false;
    while (!done) {
        let { done, value } = await reader.read();
        if (done) break;

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
                if (data.type === "message_stop" || data.type === "response.completed" ||  data.done) {
                    done = true;
                    break;
                }
            } catch (e) {
                unparsedLines.push(line);
            }
        }

        buffer = unparsedLines.join("\n");
    }

    if (buffer.length > 0) {
        try {
            const data = JSON.parse(buffer);
            yield data;
        } catch (e) {
            log.error("Error parsing JSON LINE:", buffer);
        }
    }
}

export function filterMessageRole(messages: Message[], role: MessageRole): Message[] {
    return messages.filter(message => message.role === role);
}

export function filterNotMessageRole(messages: Message[], role: MessageRole): Message[] {
    return messages.filter(message => message.role !== role);
}

export function uuid() {
    return crypto.randomUUID();
}

export function wrapTool(tool: Tool) : WrappedTool {
    if (!tool.name) throw new Error("Tool name is required");
    if (!tool.description) throw new Error("Tool description is required");
    if (!tool.input_schema) throw new Error("Tool input schema is required");

    return {
        type: "function",
        function: { name: tool.name, description: tool.description, parameters: tool.input_schema },
    };
}

export function unwrapToolCall(tool_call: WrappedToolCall) : ToolCall {
    if (!tool_call.function) throw new Error("Tool call function is required");
    if (!tool_call.function.id) tool_call.function.id = crypto.randomUUID();
    if (!tool_call.function.name) throw new Error("Tool call function name is required");
    if (!tool_call.function.arguments) throw new Error("Tool call function arguments is required");

    let args = tool_call.function.arguments;
    if (typeof args === "string") args = JSON.parse(args);

    return { id: tool_call.function.id, name: tool_call.function.name, input: args };
}