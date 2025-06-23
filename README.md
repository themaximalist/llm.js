## LLM.js

<img src="public/logo.png" alt="LLM.js — Simple LLM library for JavaScript" class="logo" style="max-width: 400px" />

<div class="badges" style="text-align: center; margin-top: -10px;">
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/themaximal1st/llm.js"></a>
<a href="https://www.npmjs.com/package/@themaximalist/llm.js"><img alt="NPM Downloads" src="https://img.shields.io/npm/dt/%40themaximalist%2Fllm.js"></a>
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/themaximal1st/llm.js"></a>
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub License" src="https://img.shields.io/github/license/themaximal1st/llm.js"></a>
</div>
<br />

**LLM.js** is a zero-dependency library to hundreds of Large Language Models.

It works in Node.js and the browser and supports all the important features for production-ready LLM apps.


```javascript
await LLM("the color of the sky is"); // blue
```

* Same interface for hundreds of LLMs (`OpenAI`, `Google`, `Anthropic`, `Groq`, `Ollama`, `xAI`, `DeepSeek`)
* [Chat](#chat) using message history
* [Stream](#streaming) responses instantly (including with thinking, tools, parsers)
* [Thinking](#thinking) with reasoning models
* [Tools](#tools) to call custom functions
* [Parsers](#parsers) including `JSON`, `XML`, `codeBlock`
* [Token Usage](#token-usage) input and output tokens on every request
* [Model List](#models) for dynamic up-to-date list of latest models
* [Cost Usage](#cost-usage) on every request
* [Options](#options) for controlling `temperature`, `max_tokens`, ...
* Abort requests mid-response
* TypeScript with clean code
* [Tests](https://github.com/themaximalist/llm.js/tree/main/test) with good coverage
* Node.js and Browser supported
* Zero-dependencies
* MIT license

## Why use LLM.js?

Why not just use the OpenAI compability API and switch out baseUrl?

1. The compability API is not compatible — there are many differences between services
2. The best features aren't on the compability API
3. There's no support for cost tracking or model features

LLM.js solves all of these and more, letting you focus on building great AI apps.

## Install

Install `LLM.js` from NPM:

```bash
npm install @themaximalist/llm.js
```

Setting up LLM.js is easy.

In Node.js api keys can be detected automatically from the environment.

```bash
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export GOOGLE_API_KEY=...
export GROQ_API_KEY=...
export DEEPSEEK_API_KEY=...
export XAI_API_KEY=...
```

They can also be included as an <a href="#options">option</a> `{apiKey: "sk-123"}`.

For the browser, keys should be included as an option.

For local models like [Ollama](https://ollama.com/), no API key is needed, just ensure an instance is running.

## Getting Started

The simplest way to call `LLM.js` is as an [async function](/docs/interfaces/LLMInterface.html) that returns a `string`.

```javascript
import LLM from "@themaximalist/llm.js"
await LLM("hello"); // Response: hi
```

This fires a one-off request, and doesn't store any history.

## Chat

Initialize an LLM instance to build up message history for [chat](/docs/classes/LLM.html#chat).

```javascript
const llm = new LLM();
await llm.chat("what's the color of the sky in hex value?"); // #87CEEB
await llm.chat("what about at night time?"); // #222d5a
```

Assistant responses are added automatically.

You can also enable the `extended` option to return more information about the request.

```javascript
const response = await LLM("what are the primary colors?", { extended: true });
console.log(response.content);   // "The primary colors are red, blue, and yellow"
console.log(response.usage);     // { input_tokens: 6, output_tokens: 12, total_cost: 0.0001 }
console.log(response.service);   // "ollama" 
console.log(response.messages);  // Full conversation history
```

## Streaming

[Streaming](/docs/interfaces/Options.html#stream) provides a better user experience by returning results immediately, and it's as simple as passing `{stream: true}` as an option.

```javascript
const stream = await LLM("the color of the sky is", { stream: true });
for await (const message of stream) {
    process.stdout.write(message);
}
```

You can also stream with message history.

```javascript
const llm = new LLM({ stream: false });
llm.system("You are a friendly AI assistant");
const stream = await llm.chat("hello, how are you?", { stream: true });
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

Just like with chat, assistant responses are automatically added with streaming. The `extended` option works as expected too.

```javascript
const response = await LLM("tell me a story", { 
  stream: true, 
  extended: true 
});

// Stream the response in real-time
for await (const chunk of response.stream) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.content);
  }
}
```

After a stream is complete, you can call `complete()` to get the complete response with metadata, including the final result, token usage, cost, etc...


```javascript
// Get the complete response with metadata
const complete = await response.complete();
console.log(complete.usage.total_cost); // 0.0023
```

## Thinking

Enable [thinking mode](/docs/interfaces/Options.html#think) for models that can reason through problems step-by-step:

```javascript
const response = await LLM("solve this math problem: 2x + 5 = 13", { 
  think: true,
});

// thinking automatically enables extended mode

// {
//   thinking: "I need to solve for x. First, I'll subtract 5 from both sides...",
//   content: "x = 4",
//   ...
// }
```

Thinking also works with streaming for real-time reasoning:

```javascript
const response = await LLM("explain quantum physics", { 
  think: true,
  stream: true 
});

let thinking = "", content = "";
for await (const chunk of response.stream) {
  if (chunk.type === "thinking") {
    thinking += chunk.content;
    updateThinkingUI(thinking)
  } else if (chunk.type === "content") {
    content += chunk.content;
    updateContentUI(content)
  }
}

// thinking and content are done, can ask for completed response
const complete = await response.complete();
// {
//   thinking: "I need to solve for x. First, I'll subtract 5 from both sides...",
//   content: "x = 4",
//   ...
// }
```

## Tools

Enable LLMs to call custom functions with [tool support](/docs/interfaces/Options.html#tools):

```javascript
const getCurrentWeather = {
  name: "get_current_weather",
  description: "Get the current weather for a city",
  input_schema: {
    type: "object",
    properties: {
      city: { type: "string", description: "The name of the city" }
    },
    required: ["city"]
  }
};

const response = await LLM("What's the weather in Tokyo?", {
  tools: [getCurrentWeather],
});

// tool use automatically enables extended mode

console.log(response.tool_calls); 
// [{ id: "call_123", name: "get_current_weather", input: { city: "Tokyo" } }]
```

Tools work with streaming for real-time function calling:

```javascript
const response = await LLM("What's the weather in Tokyo?", {
  tools: [getCurrentWeather],
  stream: true
});

for await (const chunk of response.stream) {
  if (chunk.type === "tool_calls") {
    console.log("🔧 Tool called:", chunk.content);
  } else if (chunk.type === "content") {
    process.stdout.write(chunk.content); // sometimes LLMs will return content with tool calls
  } else if (chunk.type === "thinking") {
    process.stdout.write(chunk.content); // with `think: true` they'll also return thinking
  }
}

const completed = await response.complete();
console.log("Final result:", completed.tool_calls);
```

Tool calls are automatically added to message history, making multi-turn tool conversations seamless.

## Parsers

`LLM.js` ships with helpful [parsers](/docs/modules/parsers.html) that work with every LLM:

```javascript
// JSON Parsing
const colors = await LLM("Please return the primary colors in a JSON array", {
  parser: LLM.parsers.json
});
// ["red", "green", "blue"]

// JSON Mode (automatic JSON formatting + parsing)
const data = await LLM("Return the primary colors as a JSON object", {
  json: true
});
// { colors: ["red", "green", "blue"] }

// Markdown Code Block Parsing  
const story = await LLM("Please return a story wrapped in a Markdown story code block", {
  parser: LLM.parsers.codeBlock("story")
});
// A long time ago...

// XML Parsing
const code = await LLM("Please write HTML and put it inside <WEBSITE></WEBSITE> tags", {
  parser: LLM.parsers.xml("WEBSITE")                       
});
// <html>...
```

Parsers work seamlessly with streaming, thinking and extended responses.

```javascript
const response = await LLM("return a JSON object in the form of {color: '...'} containing the color of the sky in english. no other text", {
  stream: true,
  think: true,
  json: true,
  extended: true, // implied automatically from `think: true`
});

for await (const chunk of response.stream) {
  if (chunk.type === "content") {
    process.stdout.write(chunk.content);
  } else if (chunk.type === "thinking") {
    process.stdout.write(chunk.content);
  }
}

const completed = await response.complete();
// { content: { color: "blue" } }
```

## Token Usage

Every `extended` request automatically tracks [input and output tokens](/docs/interfaces/Usage.html):

```javascript
const response = await LLM("explain quantum physics", { extended: true });
console.log(response.usage.input_tokens);  // 3
console.log(response.usage.output_tokens); // 127
console.log(response.usage.total_tokens);  // 130
```

Token counting works with all features including streaming, thinking, and tools.

```javascript
const response = await LLM("explain quantum physics", { 
  stream: true,
  extended: true,
});

for await (const chunk of response.stream) {
  // ...
}

const complete = await response.complete();
// {
//   usage: {
//     input_tokens: 3,
//     output_tokens: 127,
//     total_tokens: 130,
//     ...
//   }
// }
```

## Cost Usage

Every `extended` request automatically tracks [cost](#model-features-and-cost) based on current model pricing:

```javascript
const response = await LLM("write a haiku", { 
  service: "openai",
  model: "gpt-4o-mini",
  extended: true 
});
// {
//   usage: {
//     input_cost: 0.000045,
//     output_cost: 0.000234,
//     total_cost: 0.000279,
//     ...
//   }
// }
```

Cost usage works with all features including streaming, thinking, and tools.

```javascript
const response = await LLM("explain quantum physics", { 
  stream: true,
  extended: true,
});

for await (const chunk of response.stream) {
  // ...
}

const complete = await response.complete();
// {
//   usage: {
//     input_cost: 0.000045,
//     output_cost: 0.000234,
//     total_cost: 0.000279,
//     ...
//   }
// }
```


Local models (like Ollama) show `$0` cost and are marked as `local: true`.

## System Prompts

Tell models to specialize at specific tasks using [llm.system(input)](/docs/classes/LLM.html#system).

```javascript
const llm = new LLM();
llm.system("You are a friendly chat bot.");
await llm.chat("what's the color of the sky in hex value?"); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context)
```

## Message History

`LLM.js` supports simple string prompts, but also full [message history](/docs/interfaces/Message.html):

```javascript
await LLM("hello"); // hi

await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "assistant", content: "OK I will remember" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // blue
```

## Options

`LLM.js` provides comprehensive [configuration options](/docs/interfaces/Options.html) for all scenarios:

```javascript
const llm = new LLM(input, {
  service: "openai",        // LLM service provider
  apiKey: "sk-123"          // apiKey
  model: "gpt-4o",          // Specific model
  max_tokens: 1000,         // Maximum response length
  temperature: 0.7,         // "Creativity" (0-2)
  stream: true,             // Enable streaming
  extended: true,           // Extended responses with metadata
  messages: [],             // message history
  think: true,              // Enable thinking mode
  parser: LLM.parsers.json, // Content parser
  tools: [...],             // Available tools
  max_thinking_tokens: 500, // Max tokens for thinking
});
```

**Key Options:**

* **`service`**: Provider (`openai`, `anthropic`, `google`, `xai`, `groq`, `deepseek`, `ollama`)
* **`apiKey`**: API key for service, if not specified attempts to read from environment
* **`model`**: Specific model name (auto-detected from service if not provided)
* **`stream`**: Enable real-time streaming responses
* **`extended`**: Return detailed response with usage, costs, and metadata
* **`think`**: Enable reasoning mode for supported models
* **`temperature`**: Controls randomness (0 = deterministic, 2 = very creative)
* **`max_tokens`**: Maximum response length
* **`parser`**: Transform response content (JSON, XML, codeBlock, etc.)
* **`tools`**: Functions the model can call

## Models

`LLM.js` handles everything needed to quickly switch between and manage models from difference LLM services.

* A single interface to every model
* Fetching the latest models
* Fetching the latest features and cost data
* Quality filtering to return best models

### Switch Models

`LLM.js` supports most popular Large Language Models across both local and remote providers:

```javascript
// Defaults to Ollama (local)
await LLM("the color of the sky is");

// OpenAI
await LLM("the color of the sky is", { model: "gpt-4o-mini", service: "openai" });

// Anthropic
await LLM("the color of the sky is", { model: "claude-3-5-sonnet-latest", service: "anthropic" });

// Google
await LLM("the color of the sky is", { model: "gemini-1.5-pro", service: "google" });

// xAI
await LLM("the color of the sky is", { service: "xai", model: "grok-beta" });

// DeepSeek with thinking
await LLM("solve this puzzle", { service: "deepseek", model: "deepseek-reasoner", think: true });

// Ollama (local)
await LLM("the color of the sky is", { model: "llama3.2:3b", service: "ollama" });
```

All features work the same whether local or remote, with automatic token and cost tracking. Local models track token usage, but cost is always $0.


### Fetch Latest Models

Get the [latest available models](/docs/classes/LLM.html#fetchmodels) directly from providers:

```javascript
const llm = new LLM({ service: "openai" });
const models = await llm.fetchModels();

console.log(models.length); // 50+ models
console.log(models[0]);     // { name: "gpt-4o", created: Date, service: "openai", ... }
```

Here's an example of the models available with the [Quality Filter](#quality-models).

<div style="font-size: 14px; color: #888; max-height: 400px; overflow-y: auto; line-height: 1.2; font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 5px;">
<div>anthropic/claude-opus-4-20250514</div>
<div>anthropic/claude-sonnet-4-20250514</div>
<div>anthropic/claude-3-7-sonnet-20250219</div>
<div>anthropic/claude-3-5-sonnet-20241022</div>
<div>anthropic/claude-3-5-haiku-20241022</div>
<div>anthropic/claude-3-5-sonnet-20240620</div>
<div>anthropic/claude-3-haiku-20240307</div>
<div>anthropic/claude-3-opus-20240229</div>
<div>anthropic/claude-3-sonnet-20240229</div>
<div>ollama/deepseek-r1:8b</div>
<div>ollama/mistral-small:latest</div>
<div>ollama/phi4:latest</div>
<div>ollama/llama3.2-vision:latest</div>
<div>ollama/llava-llama3:latest</div>
<div>ollama/bakllava:latest</div>
<div>ollama/minicpm-v:latest</div>
<div>ollama/llava:latest</div>
<div>ollama/llava-phi3:latest</div>
<div>ollama/moondream:latest</div>
<div>ollama/granite3.2-vision:latest</div>
<div>ollama/phi4-mini:latest</div>
<div>ollama/gemma3:12b</div>
<div>ollama/gemma3:4b</div>
<div>ollama/llama3.3:latest</div>
<div>ollama/llama3.2:latest</div>
<div>ollama/llama3.2:1b</div>
<div>ollama/llama3-gradient:latest</div>
<div>ollama/llama3:latest</div>
<div>ollama/llama2:7b</div>
<div>ollama/llama2:latest</div>
<div>openai/gpt-4-0613</div>
<div>openai/gpt-4</div>
<div>openai/gpt-3.5-turbo</div>
<div>openai/gpt-4.1-nano</div>
<div>openai/gpt-4-1106-preview</div>
<div>openai/gpt-3.5-turbo-1106</div>
<div>openai/gpt-4-0125-preview</div>
<div>openai/gpt-4-turbo-preview</div>
<div>openai/gpt-3.5-turbo-0125</div>
<div>openai/gpt-4-turbo</div>
<div>openai/gpt-4-turbo-2024-04-09</div>
<div>openai/gpt-4o</div>
<div>openai/gpt-4o-2024-05-13</div>
<div>openai/gpt-4o-mini-2024-07-18</div>
<div>openai/gpt-4o-mini</div>
<div>openai/gpt-4o-2024-08-06</div>
<div>openai/chatgpt-4o-latest</div>
<div>openai/o1-preview-2024-09-12</div>
<div>openai/o1-preview</div>
<div>openai/o1-mini-2024-09-12</div>
<div>openai/o1-mini</div>
<div>openai/o1-2024-12-17</div>
<div>openai/o1</div>
<div>openai/o3-mini</div>
<div>openai/o3-mini-2025-01-31</div>
<div>openai/gpt-4o-2024-11-20</div>
<div>openai/gpt-4.5-preview</div>
<div>openai/gpt-4.5-preview-2025-02-27</div>
<div>openai/gpt-4o-search-preview-2025-03-11</div>
<div>openai/gpt-4o-search-preview</div>
<div>openai/gpt-4o-mini-search-preview-2025-03-11</div>
<div>openai/gpt-4o-mini-search-preview</div>
<div>openai/o1-pro-2025-03-19</div>
<div>openai/o1-pro</div>
<div>openai/o3-2025-04-16</div>
<div>openai/o4-mini-2025-04-16</div>
<div>openai/o3</div>
<div>openai/o4-mini</div>
<div>openai/gpt-4.1-2025-04-14</div>
<div>openai/gpt-4.1</div>
<div>openai/gpt-4.1-mini-2025-04-14</div>
<div>openai/gpt-4.1-mini</div>
<div>openai/gpt-4.1-nano-2025-04-14</div>
<div>openai/gpt-3.5-turbo-16k</div>
<div>google/gemini-2.5-pro-exp-03-25</div>
<div>google/gemini-2.5-pro-preview-03-25</div>
<div>google/gemini-2.5-flash-preview-04-17</div>
<div>google/gemini-2.5-flash-preview-05-20</div>
<div>google/gemini-2.5-flash-preview-04-17-thinking</div>
<div>google/gemini-2.5-pro-preview-05-06</div>
<div>google/gemini-2.5-pro-preview-06-05</div>
<div>google/gemini-2.0-flash-exp</div>
<div>google/gemini-2.0-flash</div>
<div>google/gemini-2.0-flash-001</div>
<div>google/gemini-2.0-flash-lite-001</div>
<div>google/gemini-2.0-flash-lite</div>
<div>google/gemini-2.0-flash-lite-preview-02-05</div>
<div>google/gemini-2.0-flash-lite-preview</div>
<div>google/gemini-2.0-pro-exp</div>
<div>google/gemini-2.0-pro-exp-02-05</div>
<div>google/gemini-exp-1206</div>
<div>google/gemini-2.0-flash-thinking-exp-01-21</div>
<div>google/gemini-2.0-flash-thinking-exp</div>
<div>google/gemini-2.0-flash-thinking-exp-1219</div>
<div>google/gemini-2.5-flash-preview-tts</div>
<div>google/gemini-2.5-pro-preview-tts</div>
<div>xai/grok-2-1212</div>
<div>xai/grok-3</div>
<div>xai/grok-3-fast</div>
<div>xai/grok-3-mini</div>
<div>xai/grok-3-mini-fast</div>
<div>groq/llama3-8b-8192</div>
<div>groq/compound-beta</div>
<div>groq/llama-3.1-8b-instant</div>
<div>groq/qwen-qwq-32b</div>
<div>groq/gemma2-9b-it</div>
<div>groq/deepseek-r1-distill-llama-70b</div>
<div>groq/allam-2-7b</div>
<div>groq/meta-llama/llama-4-maverick-17b-128e-instruct</div>
<div>groq/meta-llama/llama-prompt-guard-2-86m</div>
<div>groq/llama3-70b-8192</div>
<div>groq/llama-guard-3-8b</div>
<div>groq/meta-llama/llama-prompt-guard-2-22m</div>
<div>groq/compound-beta-mini</div>
<div>groq/meta-llama/llama-guard-4-12b</div>
<div>groq/meta-llama/llama-4-scout-17b-16e-instruct</div>
<div>groq/mistral-saba-24b</div>
<div>groq/llama-3.3-70b-versatile</div>
<div>deepseek/deepseek-chat</div>
<div>deepseek/deepseek-reasoner</div>
</div>

### Model Features and Cost

`LLM.js` combines the fetched models from each provider, with the [feature and cost list](/docs/classes/ModelUsage.html) from [LiteLLM](https://litellm.ai/).

This provides real-time cost per input/output token, and model features like context window, tool support, thinking support, and more!

```javascript
import { ModelUsage } from "@themaximalist/llm.js";

// Get all cached models
const allModels = ModelUsage.getAll();
console.log(allModels.length); // 100+

// Refresh from latest sources  
const refreshedModels = await ModelUsage.refresh();
console.log(refreshedModels.length); // Even more models

// Get specific model info
const gpt4 = ModelUsage.get("openai", "gpt-4o");
console.log(gpt4.input_cost_per_token);  // 0.0000025
console.log(gpt4.max_input_tokens);      // 128000
```

When using the `extended` option — token usage and cost are automatically added to responses.


### Quality Models

The model APIs return every model supported by the platform. If you need to present these to users — it's a mess.

The [Quality Models](/docs/classes/LLM.html#getqualitymodels) filter out things like embeddings, tts, instruct, audio, image, etc... models to only present the best LLM models.

```javascript
const llm = new LLM({ service: "anthropic" });
const qualityModels = await llm.getQualityModels();

for (const model of qualityModels) {
  console.log(model.model);                 // "claude-3-5-sonnet-latest"
  console.log(model.input_cost_per_token);  // 0.000003
  console.log(model.output_cost_per_token); // 0.000015
  console.log(model.max_tokens);            // 8192
  console.log(model.created);               // 2024-10-22T00:00:00.000Z
}
```

### Custom Models

If the refreshed model list doesn't have a model you need, or you have a custom model — you can [add custom token and pricing information](/docs/classes/ModelUsage.html#addcustom).

```javascript
import { ModelUsage } from "@themaximalist/llm.js";

ModelUsage.addCustom({
  model: "my-custom-gpt",
  service: "openai", 
  input_cost_per_token: 0.00001,
  output_cost_per_token: 0.00003,
  max_tokens: 4096
});

// Now use it like any other model
const response = await LLM("hello", { 
  service: "openai", 
  model: "my-custom-gpt",
  extended: true 
});
console.log(response.usage.total_cost); // Uses your custom pricing
```

## Custom Services

You can add custom services to `LLM.js` by passing a custom object:

```javascript
const llm = new LLM({
    service: "together",
    baseUrl: "https://api.together.xyz/v1",
    model: "meta-llama/Llama-3-70b-chat-hf",
    apiKey,
});
```

You can also create a custom service by extending the `LLM.APIv1` class:

```javascript
class Together extends LLM.APIv1 {
    static readonly service: ServiceName = "together";
    static DEFAULT_BASE_URL: string = "https://api.together.xyz/v1";
    static DEFAULT_MODEL: string = "meta-llama/Llama-3-70b-chat-hf";
}

const llm = new Together();
```

You can even register the custom services with `LLM.js` to make them available globally:

```javascript

LLM.register(Together);
const llm = new LLM({ service: "together" });
```

To implement a fully custom model, subclass `LLM` and implement the `parse` methods:

```javascript
class Custom extends LLM {
    static readonly service: ServiceName = "secretAGI";
    static DEFAULT_BASE_URL: string = "http://localhost:9876";
    static DEFAULT_MODEL: string = "gpt-999";
    static isLocal: boolean = false; // don't track pricing
    static isBearerAuth: boolean = false;

    get chatUrl() { return `${this.baseUrl}/chat` }
    get modelsUrl() { return `${this.baseUrl}/models` }

    parseContent(data: any): string { ... }
    parseTools(data: any): ToolCall[] { ... }
    parseThinking(data: any): string { ... }
    parseModel(model: any): Model { ... }
    parseOptions(options: Options): Options { ... }
    parseTokenUsage(usage: any): InputOutputTokens | null { ... }
    parseUsage(tokenUsage: InputOutputTokens): Usage { ... }

    // streaming methods
    parseToolsChunk(chunk: any): ToolCall[] { return this.parseTools(chunk) }
    parseContentChunk(chunk: any): string { return this.parseContent(chunk) }
    parseThinkingChunk(chunk: any): string { return this.parseThinking(chunk) }
}
```

## Connection Verification

Test your setup and API keys with built-in connection verification:

```javascript
const llm = new LLM({ service: "openai" });
const isConnected = await llm.verifyConnection();
console.log(isConnected); // true if API key and service work
```

This is a light check that doesn't perform a LLM chat response. For non-local services it detects if it can fetch models. For local services it detects if an instance is up and running.


## Examples

The [test suite](https://github.com/themaximalist/llm.js/tree/main/test) contains comprehensive examples of all features.


## API Reference

See the full [API reference](/docs/modules.html).

## Debug

`LLM.js` uses a `debug` like logging system with the `llm.js` namespace.

View debug logs by setting the `DEBUG` environment variable:

```bash
> DEBUG=llm.js* node your-script.js
# debug logs
blue
```


## Projects

`LLM.js` is currently used in production by:

-   [Infinity Arcade](https://infinityarcade.com) — play any text adventure game
-   [News Score](https://newsscore.com) — score and sort the news
-   [AI Image Explorer](https://aiimageexplorer.com) — image explorer
-   [Think Machine](https://thinkmachine.com) — AI research assistant
-   [Thinkable Type](https://thinkabletype.com) — Information Architecture Language
-   [Minds App](https://mindsapp.com) — AI chat in your menubar

## Changelog

- 06/22/2025 — `v1.0.1` — Attachment support (images and PDF), Better model features support and tags
- 06/13/2025 — `v1.0.0` — Added thinking mode, extended responses, token/cost usage, model management, TypeScript. Removed Together, Perplexity, Llamafile
- 01/27/2025 — `v0.8.0` — Added DeepSeek
- 12/19/2024 — `v0.7.1` — Fixed Anthropic streaming bug
- 10/25/2024 — `v0.7.0` — Added Perplexity, upgraded all models to latest
- 04/24/2024 — `v0.6.6` — Added browser support
- 04/18/2024 — `v0.6.5` — Added Llama 3 and Together
- 03/25/2024 — `v0.6.4` — Added Groq and abort()
- 03/17/2024 — `v0.6.3` — Added JSON/XML/Markdown parsers and a stream handler
- 03/15/2024 — `v0.6.2` — Fix bug with Google streaming
- 03/15/2024 — `v0.6.1` — Fix bug to not add empty responses
- 03/04/2024 — `v0.6.0` — Added Anthropic Claude 3
- 03/02/2024 — `v0.5.9` — Added Ollama
- 02/15/2024 — `v0.5.4` — Added Google Gemini
- 02/13/2024 — `v0.5.3` — Added Mistral
- 01/15/2024 — `v0.5.0` — Created website
- 01/12/2024 — `v0.4.7` — OpenAI Tools, JSON stream
- 01/07/2024 — `v0.3.5` — Added ModelDeployer
- 01/05/2024 — `v0.3.2` — Added Llamafile
- 04/26/2023 — `v0.2.5` — Added Anthropic, CLI
- 04/24/2023 — `v0.2.4` — Chat options
- 04/23/2023 — `v0.2.2` — Unified LLM() interface, streaming
- 04/22/2023 — `v0.1.2` — Docs, system prompt
- 04/21/2023 — `v0.0.1` — Created LLM.js with OpenAI support

## License

MIT

## Author

Created by [Brad Jasper](https://bradjasper.com/), a product developer working on AI-powered apps and tools.

**Need help with your LLM project?** I'm available for consulting on web, desktop, mobile, and AI development. [Get in touch →](https://bradjasper.com/)
