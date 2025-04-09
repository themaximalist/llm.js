import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const models = ['o1-preview'];
const options = {
    "o1-preview": {
        "temperature": 1,
        "max_tokens": 1000
    }
};

// const models = ['gpt-4o', 'o1-mini', 'o1-preview'];
// const models = ['gpt-4o', 'claude-3-7-sonnet-latest'];

    // it("o1-mini", async function () {
    //     this.timeout(15000);
    //     this.slow(7000);
    //     const response = await LLM("the color of the sky is", { model: "o1-mini" });
    //     assert(response.indexOf("blue") !== -1, response);
    // });

    // it("o1-preview", async function () {
    //     this.timeout(15000);
    //     this.slow(7000);
    //     const response = await LLM("the color of the sky is", { model: "o1-preview" });
    //     assert(response.indexOf("blue") !== -1, response);
    // });

    
describe('OpenAI Interface', function() {
    models.forEach(function(model) {
      describe(`with ${model}`, function() {
        this.timeout(10000);
        this.slow(5000);

        this.afterEach(async function () {
            await delay(500);
        });
    
        before(function() {
          this.currentModel = model;
          // Setup the model instance, etc.
        });

        it("simple prompt", async function () {
            const opts = { temperature: 0, max_tokens: 1000, model: this.currentModel, ...options[this.currentModel] };
            console.log("opts", opts);
            const response = await LLM("in one word the color of the sky is", opts);
            console.log("response", response);
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
            console.log("response", response);
            assert(response.toLowerCase().indexOf("blue") !== -1, response);
        });

        it("json", async function () {
            const opts = { temperature: 0, max_tokens: 100, model: this.currentModel, json: true, ...options[this.currentModel] };
            const response = await LLM("what is the color of the sky in JSON format {color: 'single-word'}?", opts);
            assert(response.color);
            assert(response.color.toLowerCase().indexOf("blue") !== -1);
        });

        it("json schema", async function () {
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
            const response = await LLM("who created hypertext?", { stream: true, temperature: 0, max_tokens: 30, model: this.currentModel, ...options[this.currentModel] });

            let buffer = "";
            for await (const content of response) {
                buffer += content;
            }

            assert(buffer.toLowerCase().includes("ted nelson"));
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

            let response = await llm.chat("tell me a long story");
            let buffer = "";
            try {
                for await (const content of response) {
                    process.stdout.write(content);
                    buffer += content;

                    if (buffer.length > 50) {
                        llm.abort();
                    }
                }

                assert.fail("Expected to abort");
            } catch (err) {
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

*/