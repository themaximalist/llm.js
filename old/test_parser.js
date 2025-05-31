import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const models = [
    "gpt-4-turbo-preview",
    "claude-3-opus-20240229",
    "gemini-pro",
];

describe("parser", function () {
    this.timeout(60000);
    this.slow(30000);

    this.afterEach(async function () {
        await delay(1000);
    });

    it("code block parser", async function () {
        for (const model of models) {
            const prompt = "Please return a Markdown 'text' codeblock that contains the words 'Hello World'";
            const response = await LLM(prompt, { model, temperature: 0, parser: LLM.parsers.codeBlock("text") });
            assert(response.toLowerCase().indexOf("hello world") !== -1, response);
        }
    });

    it("code block json parser", async function () {
        for (const model of models) {
            const prompt = "Please return a Markdown 'json' codeblock that contains the array ['A', 'B', 'C']";
            const response = await LLM(prompt, { model, temperature: 0, parser: LLM.parsers.json });
            assert(response.length == 3);
            assert(response[0] === "A");
            assert(response[1] === "B");
            assert(response[2] === "C");
        }
    });

    it("json parser", async function () {
        for (const model of models) {
            const prompt = `Please return the only JSON object {"colors": ["red", "green", "blue"]}`;
            const response = await LLM(prompt, { model, temperature: 0, parser: LLM.parsers.json });
            assert(response.colors.length === 3);
            assert(response.colors[0] === "red");
            assert(response.colors[1] === "green");
            assert(response.colors[2] === "blue");
        }
    });

    it("XML parser", async function () {
        for (const model of models) {
            const prompt = `Please return the text 'Hello World' inside of a <CONTENT></CONTENT> XML tag. Don't return any other content besides this XML tag.`;
            const response = await LLM(prompt, { model, temperature: 0, parser: LLM.parsers.xml("CONTENT") });
            assert(response.toLowerCase() === "hello world", response);
        }
    });
});
