import debug from "debug";
const log = debug("llm.js:agents");
import LLM from "./index.js";

export class Agent {
    get tools() {
        return this.constructor.tools;
    }

    get name() {
        return this.constructor.name.toLowerCase();
    }

    get options() {
        return {
            model: this.constructor.model || LLM.defaultModel,
        }
    }

    getTool(name) {
        return this.tools.find(tool => tool.name === name);
    }

    async runTool(fn) {
        if (!fn) throw new Error(`No function to run`);
        if (!fn.name) throw new Error(`No name to run function`);
        if (!fn.arguments) throw new Error(`No arguments to run function`);

        const tool = this.getTool(fn.name);
        if (!tool) throw new Error(`Tool ${fn.name} not found`);

        log(`running tool ${tool.name} with arguments: ${fn.arguments}`);
        const result = tool.run(JSON.parse(fn.arguments));
        log(`tool ${tool.name} returned: ${result}`);
        return result;
    }

    async run(prompt, callback, maxIterations = 10) {
        log(`running ${this.name} with prompt: ${prompt}`);

        const options = {
            tools: this.tools.map(tool => tool.schema),
            ...this.options,
        };

        const llm = new LLM([], options);
        llm.messages.push({ role: "user", content: prompt });

        for (let i = 0; i < maxIterations; i++) {
            const responses = await llm.send();
            callback(responses);
            for (const response of responses) {
                if (response && response.type === "function" && response.function) {
                    const lastMessage = llm.messages[llm.messages.length - 1];
                    if (lastMessage.role !== "assistant") throw new Error(`Expected assistant message, got ${lastMessage.role}`);
                    if (lastMessage.tool_calls.length !== 1) throw new Error(`Expected tool call, got ${lastMessage.tool_calls}`);

                    const content = await this.runTool(response.function);
                    const message = {
                        role: "tool",
                        content: JSON.stringify(content),
                        tool_call_id: lastMessage.tool_calls[0].id,
                    };

                    llm.messages.push(message);
                } else {
                    return response;
                }
            }
        }

    }
}