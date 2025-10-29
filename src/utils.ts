import logger from "./logger";
import type { Message, MessageRole, Tool, ToolCall, WrappedTool, WrappedToolCall } from "./LLM.types";

const log = logger("llm.js:utils");

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
    } else if (data.error && typeof data.error === "object") {
        err = JSON.stringify(data.error);
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

export function keywordFilter(str: string, keywords: string[]): boolean {
  for (const keyword of keywords) {
    if (str.includes(`${keyword}-`)) return false;
    if (str.includes(`-${keyword}`)) return false;
  }
  return true;
}

export function isBrowser(): boolean {
    return typeof window !== 'undefined' && !isNode();
}

export function isNode(): boolean {
    return typeof process !== 'undefined' && !isBrowser();
}

export function apiKeys() {
    if (isBrowser()) {
        return Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.indexOf("API_KEY") !== -1));
    } else {
        return Object.fromEntries(Object.entries(process.env).filter(([key]) => key.indexOf("API_KEY") !== -1));
    }
}

/* @ts-ignore */
export const environment = isBrowser() ? import.meta.env : process.env;


export function getenv(key: string) {
    return environment[key] ?? environment[`VITE_${key}`];
}

/**
 * Deep clone an object while preserving class instances and their methods
 * Unlike JSON.parse(JSON.stringify()), this preserves prototype chains
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepClone(item)) as T;
    }

    if (obj instanceof RegExp) {
        return new RegExp(obj) as T;
    }

    // For class instances, preserve the prototype
    if (obj.constructor !== Object) {
        const cloned = Object.create(Object.getPrototypeOf(obj));
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone((obj as any)[key]);
            }
        }
        return cloned;
    }

    // For plain objects
    const cloned = {} as T;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            (cloned as any)[key] = deepClone((obj as any)[key]);
        }
    }

    return cloned;
}

export function join(...pathSegments: string[]): string {
    if (pathSegments.length === 0) return ".";
    
    const firstSegment = pathSegments[0];
    const isUrl = firstSegment.startsWith("http://") || firstSegment.startsWith("https://");
    
    if (isUrl) {
        const [protocol, ...urlParts] = firstSegment.split("://");
        const remainingSegments = pathSegments.slice(1);
        
        const allSegments = [urlParts.join("://"), ...remainingSegments];
        const joinedPath = allSegments.join("/").replace(/\/+/g, "/"); // Remove duplicate slashes
        
        return `${protocol}://${joinedPath}`;
    }
    
    let parts: string[] = [];
    for (let i = 0, l = pathSegments.length; i < l; i++) {
      parts = parts.concat(pathSegments[i].split("/"));
    }

    const newParts: string[] = [];
    for (let i = 0, l = parts.length; i < l; i++) {
      const part = parts[i];
      if (!part || part === ".") continue;
      if (part === "..") newParts.pop();
      else newParts.push(part);
    }

    if (parts[0] === "") newParts.unshift("");
    return newParts.join("/") || (newParts.length ? "/" : ".");
}