import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const models = [
    "gemini-2.0-flash",
    // "claude-3-7-sonnet-latest",
    // 'gpt-4o',
    // "o1-preview",
    // "o1-mini",
];

const options = {
    "o1-preview": {
        "temperature": 1,
        "max_tokens": 1000,
    },
    "o1-mini": {
        "temperature": 1,
        "max_tokens": 1000,
    }
};

describe('OpenAI Interface', function() {
    models.forEach(function(model) {
      describe(`with ${model}`, function() {
        this.timeout(100_000);
        this.slow(6000);
    
        this.afterEach(async function () {
            await delay(2500);
        });

        before(function() {
          this.currentModel = model;
          this.startTime = Date.now();
        });

        after(async function() {
            this.endTime = Date.now();
            console.log(`${this.currentModel} took ${this.endTime - this.startTime}ms`);
            await delay(1000);
        });

        it("simple prompt", async function () {
            const opts = { temperature: 0, max_tokens: 1, model: this.currentModel, ...options[this.currentModel] };
            const response = await LLM("in one word the color of the sky is", opts);
            assert(response.toLowerCase().indexOf("blue") !== -1, response);
        });

        it("chat", async function () {
            const opts = { temperature: 0, max_tokens: 1, model: this.currentModel, ...options[this.currentModel] };
            const llm = new LLM([], opts);
            await llm.chat("my favorite color is blue. remember this");


            const response = await llm.chat("in one word what is my favorite color i just told you?");
            assert(response.toLowerCase().indexOf("blue") !== -1, response);
        });

        it("existing chat", async function () {
            const opts = { temperature: 0, max_tokens: 1, model: this.currentModel, ...options[this.currentModel] };
            const llm = new LLM([
                { role: 'user', content: 'my favorite color is blue. remember it.' },
                { role: 'assistant', content: 'My favorite color is blue as well.' },
                { role: 'user', content: 'in one word what is my favorite color that i just told you?' },
            ], opts);

            const response = await llm.send();
            assert(response.toLowerCase().indexOf("blue") !== -1, response);
        });

        it("json", async function () {
            if (this.currentModel.indexOf("o1-") !== -1) this.skip();
            const opts = { temperature: 0, max_tokens: 100, model: this.currentModel, json: true, ...options[this.currentModel] };
            const response = await LLM("what is the color of the sky in JSON format {color: 'single-word'}?", opts);
            assert(response.color);
            assert(response.color.toLowerCase().indexOf("blue") !== -1);
        });

        it("json schema", async function () {
            if (this.currentModel.indexOf("o1-") !== -1) this.skip();
            const schema = {
                "type": "object",
                "properties": { "colors": { "type": "array", "items": { "type": "string" } } },
                "required": ["colors"]
            }

            const opts = { temperature: 0, max_tokens: 100, model: this.currentModel, schema, ...options[this.currentModel] };

            const obj = await LLM("what are the 3 primary colors in JSON format? use 'colors' as the object key for the array", opts);

            assert(obj.colors);
            assert(obj.colors.length == 3);
            assert(obj.colors.includes("blue"));
        });

        it("streaming", async function () {
            const response = await LLM("in one word what is the color of the sky?", { stream: true, temperature: 0, max_tokens: 30, model: this.currentModel, ...options[this.currentModel] });

            let buffer = "";
            for await (const content of response) {
                buffer += content;
            }

            assert(buffer.toLowerCase().includes("blue"));
        });

        it("streaming with history", async function () {
            const llm = new LLM([], { stream: true, temperature: 0, max_tokens: 30, model: this.currentModel, ...options[this.currentModel] });

            let response = await llm.chat("double this number: 25");
            for await (const content of response) {}

            response = await llm.chat("repeat your last message");
            let buffer = "";
            for await (const content of response) {
                buffer += content;
            }

            assert(buffer.includes("50"));
        });

        it("can abort", async function () {
            const llm = new LLM([], { stream: true, temperature: 0, model: this.currentModel, ...options[this.currentModel] });

            let response = await llm.chat("tell me a short story");
            let buffer = "";
            try {
                for await (const content of response) {
                    buffer += content;

                    if (buffer.length > 25) {
                        llm.abort();
                    }
                }

                assert.fail("Expected to abort");
            } catch (err) {
                console.log("err", err);
                assert(err.message === "Request aborted");
            }

            assert(buffer.length > 0);
        });
      });
    });
  });

  /*
describe("openai", function () {

    it("returns extended response", async function () {
        const response = await LLM("be concise. the color of the sky is", { model, extended: true });
        assert(response.messages.length === 2);
        assert(response.options.model === model);
        assert(response.response.toLowerCase().indexOf("blue") !== -1);
    });

    it("tracks token usage and cost", async function () {
        const model = "claude-3-7-sonnet-20250219";
        const response = await LLM("in one word the color of the sky is", { model, temperature: 0, extended: true, max_tokens: 1 });
        assert(response.response.toLowerCase().indexOf("blue") !== -1, response);
        assert(response.options.model === model);
        assert(response.options.temperature === 0);
        assert(response.options.max_tokens === 1);
        assert(response.usage.output_tokens === 1);
        assert(response.usage.input_tokens === 16);
        assert(response.usage.cost > 0);
        assert(response.usage.cost < 0.0001);
    });

});

// extended response
// token usage
// stream finished concept
// streaming extended response
// streaming token usage



*/