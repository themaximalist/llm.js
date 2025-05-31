import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

const models = [
    // { model: "llamafile", service: "llamafile" },
    // { model: "llama3.2:1b", service: "ollama" },
    // 'gpt-4o',
    // { model: "deepseek-chat", service: "deepseek" },
    // "gemini-2.0-flash",
    "claude-opus-4-20250514",
    // 'grok-3-latest',
    // 'gpt-4.5-preview',
    // { model: "o1-preview", temperature: 1, max_tokens: 1000 },
    // { model: "o1-mini", temperature: 1, max_tokens: 1000 },
    // { model: "llama-3.1-8b-instant", service: "groq" },
    // { model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", service: "together" },
];

describe("Models", function () {
  models.forEach(function (model) {
    const modelName = model.model ?? model;
    const options = typeof model === "object" ? model : {};
    options.model = modelName;

    describe(`with ${modelName}`, function () {
      this.timeout(100_000);
      this.slow(10_000);

      this.afterEach(async function () {
        await delay(2500);
      });

      before(function () {
        this.currentModel = modelName;
        this.currentService = options.service ?? LLM.serviceForModel(this.currentModel);
        this.isLocal = LLM.isLocalService(this.currentService);

        this.startTime = Date.now();
      });

      after(async function () {
        this.endTime = Date.now();
        console.log(
          `${this.currentModel} took ${this.endTime - this.startTime}ms`
        );
        await delay(1000);
      });

      it("simple prompt", async function () {
        const opts = { temperature: 0, max_tokens: 1, ...options };
        const response = await LLM("in one word the color of the sky is usually", opts);
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
      });

      it("chat", async function () {
        const opts = { temperature: 0, max_tokens: 1, ...options };
        const llm = new LLM([], opts);
        await llm.chat("my favorite color is blue. remember this. say ok if you understand");

        const response = await llm.chat(
          "in one word in plain text what is my favorite color i just told you?"
        );
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
      });

      it("existing chat", async function () {
        const opts = { temperature: 0, max_tokens: 1, ...options };
        const llm = new LLM(
          [
            { role: "user", content: "my favorite color is blue. remember it.", },
            { role: "assistant", content: "My favorite color is blue as well.", },
            { role: "user", content: "in one word what is my favorite color that i just told you?", },
          ],
          opts
        );

        const response = await llm.send();
        assert(response.toLowerCase().indexOf("blue") !== -1, response);
      });

      it("json", async function () {
        if (this.currentModel.indexOf("o1-") !== -1) this.skip();
        const opts = {
          temperature: 0,
          max_tokens: 100,
          json: true,
          ...options,
        };
        const response = await LLM(
          "reply in properly formatted JSON format {color: 'single-word'} — what is the color of the sky?",
          opts
        );
        assert(response.color);
        assert(response.color.toLowerCase().indexOf("blue") !== -1);
      });

      it("json schema", async function () {
        if (this.currentModel.indexOf("o1-") !== -1) this.skip();
        if (this.currentModel.indexOf("llama-3.1") !== -1) this.skip();
        if (this.currentModel.indexOf("llama3.2") !== -1) this.skip();

        const schema = {
          type: "object",
          properties: { colors: { type: "array", items: { type: "string" } } },
          required: ["colors"],
        };

        const opts = { temperature: 0, max_tokens: 100, schema, ...options };

        const obj = await LLM(
          "what are the 3 primary colors in JSON format? use 'colors' as the object key for the array",
          opts
        );

        assert(obj.colors);
        assert(obj.colors.length == 3);
        assert(obj.colors.includes("blue"));
      });

      it("streaming", async function () {
        const opts = {
          stream: true,
          temperature: 0,
          max_tokens: 30,
          ...options,
        };
        const response = await LLM(
          "in one word what is the color of the sky?",
          opts
        );

        let buffer = "";
        for await (const content of response) {
          buffer += content;
        }

        assert(buffer.toLowerCase().includes("blue"));
      });

      it("streaming with history", async function () {
        const opts = {
          stream: true,
          temperature: 0,
          max_tokens: 30,
          ...options,
        };
        const llm = new LLM([], opts);

        let response = await llm.chat("in one word the color of the sky is");
        for await (const content of response) {
        }

        response = await llm.chat("repeat your last message");
        let buffer = "";
        for await (const content of response) {
          buffer += content;
        }

        assert(buffer.toLowerCase().includes("blue"));
      });

      it("can abort", async function () {
        const opts = { stream: true, temperature: 0, max_tokens: 1024, ...options };
        const llm = new LLM([], opts);

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
          assert(err.message.toLowerCase().indexOf("abort") !== -1);
        }

        assert(buffer.length > 0);
      });

      it.only("returns extended response", async function () {
        const opts = { extended: true, max_tokens: 1024, ...options };
        const response = await LLM("be concise. the color of the sky is", opts);
        console.log("RESPONSE", response);
        assert(response.messages.length === 2);
        assert(response.options.model === this.currentModel);
        assert(response.response.toLowerCase().indexOf("blue") !== -1);
      });

      it("stream returns extended response", async function () {
        const opts = { extended: true, stream: true, ...options };
        const response = await LLM("be concise. the color of the sky is", opts);
        let buffer = "";
        for await (const content of response.stream) {
          buffer += content;
        }

        const complete = await response.complete();

        assert(complete.model === this.currentModel);
        assert(buffer.toLowerCase().indexOf("blue") !== -1);
        assert(complete.messages.length === 2);
        assert(
          complete.messages[1].content.toLowerCase().indexOf("blue") !== -1
        );
      });

      it("tracks token usage and cost", async function () {
        const opts = { extended: true, max_tokens: 1, ...options };

        const response = await LLM("in one word the color of the sky is usually", opts);
        assert(
          response.response.toLowerCase().indexOf("blue") !== -1,
          response
        );
        assert(response.options.model === this.currentModel);
        assert(response.options.max_tokens === 1);
        assert(response.usage.output_tokens === 1);
        assert(response.usage.input_tokens > 10);

        if (this.isLocal) {
          assert(response.usage.input_cost === 0);
          assert(response.usage.output_cost === 0);
          assert(response.usage.cost === 0);
        } else {
          assert(response.usage.input_cost > 0);
          assert(response.usage.output_cost > 0);
          assert(response.usage.input_cost < 0.0001);
          assert(response.usage.output_cost < 0.0001);
          assert(response.usage.cost > 0);
          assert(response.usage.cost < 0.0002);
        }
        assert(
          response.usage.cost ===
            response.usage.input_cost + response.usage.output_cost
        );
      });

      it("streaming tracks token usage and cost", async function () {
        const opts = {
          extended: true,
          max_tokens: 50,
          stream: true,
          ...options,
        };

        const response = await LLM("tell me a story that starts with the word 'blue'", opts);
        let buffer = "";
        for await (const content of response.stream) {
          buffer += content;
        }

        const complete = await response.complete();

        assert(buffer.toLowerCase().indexOf("blue") !== -1, buffer);
        assert(complete.model === this.currentModel);

        if (this.isLocal) {
          assert(complete.usage.input_cost === 0);
          assert(complete.usage.output_cost === 0);
          assert(complete.usage.cost === 0);
        } else {
          assert(complete.usage.output_tokens >= 1);
          assert(complete.usage.input_tokens > 10);
          assert(complete.usage.input_cost > 0);
          assert(complete.usage.output_cost > 0);
          assert(complete.usage.input_cost <= 0.01);
          assert(complete.usage.output_cost <= 0.1);
          assert(complete.usage.cost > 0);
          assert(complete.usage.cost <= 0.1);
        }

        assert(
          complete.usage.cost ===
            complete.usage.input_cost + complete.usage.output_cost
        );
      });

      it("default model for service", async function () {
        const llm = LLM.llmForService("openai");
        assert(llm);
        assert(llm.defaultModel);
        assert(typeof llm.defaultModel === "string");
        assert(llm.defaultModel.length > 0);
      });

      it.skip("thinking", async function () {
        const opts = { temperature: 1, max_tokens: 2048, ...options };
        opts.thinking = {
          type: "enabled",
          budget_tokens: 1024 
        };
        const response = await LLM("in one word the color of the sky is usually", opts);
        console.log(response);
      });

    });

  });
});