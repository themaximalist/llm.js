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

* **Same interface** for hundreds of LLMs (`OpenAI`, `Google`, `Anthropic`, `Groq`, `Llamafile`, `Ollama`, `xAI`, `DeepSeek`)
* **[Chat](#chat)** using message history
* **[Stream](#streaming)** responses instantly with support for every feature
* **[Thinking](#thinking)** with reasoning for models that can think (also works with [streaming](#streaming))
* **[Tools](#tools)** to call custom functions
* **[Parsers](#parsers)** including `JSON`, `XML`, `codeBlock`
* **Options** for controlling `temperature`, `max_tokens`, ...
* **Model List** for dynamic up-to-date list of latest models
* **[Token Usage](#extended-responses)** input and output tokens on every request
* **[Cost Usage](#extended-responses)** on every request
* **Abort** requests mid-response
* **TypeScript** with clean code
* **[Tests](https://github.com/themaximalist/llm.js/tree/main/test)** with good coverage
* **Node.js and Browser** supported
* **Zero-dependencies**
* **MIT license**

## Why use LLM.js?

There are many LLM providers, and while the OpenAI v1 API is compatible with most, `LLM.js` goes far beyond basic compatibility:

* **Unified Interface**: Works with hundreds of models across multiple providers with the same API
* **Advanced Features**: Thinking, tools, and streaming work seamlessly across all providers
* **Provider-Specific Optimizations**: Uses each provider's native API for best performance and features
* **Complete Usage Tracking**: Automatic token counting and cost calculation for all requests
* **Model Management**: Dynamic model lists, quality filtering, and up-to-date pricing
* **Production Ready**: Built-in error handling, retries, and comprehensive TypeScript support

While many services offer OpenAI v1 compatibility, they often lack their best features on those endpoints. `LLM.js` uses each provider's native API to unlock full capabilities while maintaining a consistent interface.

## Install

Install `LLM.js` from NPM:

```bash
npm install @themaximalist/llm.js
```

Setting up LLMs is easy—just make sure your API key is set in your environment:

```bash
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export GOOGLE_API_KEY=...
export GROQ_API_KEY=...
export DEEPSEEK_API_KEY=...
export XAI_API_KEY=...
```

For local models like [llamafile](https://github.com/Mozilla-Ocho/llamafile) and [Ollama](https://ollama.com/), ensure an instance is running.

## Getting Started

The simplest way to call `LLM.js` is as an `async function`.

```javascript
import LLM from "@themaximalist/llm.js"
await LLM("hello"); // Response: hi
```

This fires a one-off request, and doesn't store any history.

## Chat

Initialize an LLM instance to build up message history.

```javascript
const llm = new LLM();
await llm.chat("what's the color of the sky in hex value?"); // #87CEEB
await llm.chat("what about at night time?"); // #222d5a
```

## Streaming

Streaming provides a better user experience by returning results immediately, and it's as simple as passing `{stream: true}` as an option.

```javascript
const stream = await LLM("the color of the sky is", { stream: true });
for await (const message of stream) {
    process.stdout.write(message);
}
```

## Extended Responses

For more detailed information including token usage, costs, and metadata, use extended responses:

```javascript
const response = await LLM("what are the primary colors?", { extended: true });
console.log(response.content);     // "The primary colors are red, blue, and yellow"
console.log(response.usage);       // { input_tokens: 6, output_tokens: 12, total_cost: 0.0001 }
console.log(response.service);     // "ollama" 
console.log(response.messages);    // Full conversation history
```

Extended responses work with streaming too—you get real-time streaming plus the complete response:

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

// Get the complete response with metadata
const complete = await response.complete();
console.log(complete.usage.total_cost); // 0.0023
```

## Thinking

Enable thinking mode for models that can reason through problems step-by-step:

```javascript
const response = await LLM("solve this math problem: 2x + 5 = 13", { 
  think: true,
  extended: true 
});

console.log(response.thinking); // "I need to solve for x. First, I'll subtract 5 from both sides..."
console.log(response.content);  // "x = 4"
```

Thinking also works with streaming for real-time reasoning:

```javascript
const response = await LLM("explain quantum physics", { 
  think: true,
  stream: true 
});

for await (const chunk of response.stream) {
  if (chunk.type === "thinking") {
    console.log("🤔", chunk.content);
  } else if (chunk.type === "content") {
    console.log("💬", chunk.content);
  }
}
```

## Switch LLMs

`LLM.js` supports most popular Large Language Models:

* [OpenAI](https://platform.openai.com/docs/models/): `o1-preview`, `o1-mini`, `gpt-4o`, `gpt-4o-mini`
* [Google](https://deepmind.google/technologies/gemini/): `gemini-1.5-pro`, `gemini-1.0-pro`
* [Anthropic](https://docs.anthropic.com/en/docs/about-claude/models): `claude-3-5-sonnet-latest`, `claude-3-opus-latest`, `claude-3-haiku-latest`
* [Groq](https://console.groq.com/docs/models): `llama3-groq-70b-8192-tool-use-preview`, `llama-3.2-90b-vision-preview`
* [xAI](https://docs.x.ai/): `grok-beta`, `grok-vision-beta`
* [DeepSeek](https://api-docs.deepseek.com/): `deepseek-chat`, `deepseek-reasoner`
* [llamafile](https://github.com/Mozilla-Ocho/llamafile): `LLaVa-1.5`, `TinyLlama-1.1B`, `Phi-2`, ...
* [Ollama](https://ollama.com/): `llama3.2`, `llama3.1`, `gemma2`, `qwen2.5`, `phi3.5`, `mistral-small` ... 

`LLM.js` can guess the LLM provider based on the model, or you can specify it explicitly.

```javascript
// Defaults to Ollama (local)
await LLM("the color of the sky is");

// OpenAI
await LLM("the color of the sky is", { model: "gpt-4o-mini" });

// Anthropic
await LLM("the color of the sky is", { model: "claude-3-5-sonnet-latest" });

// Google
await LLM("the color of the sky is", { model: "gemini-1.5-pro" });

// xAI
await LLM("the color of the sky is", { service: "xai", model: "grok-beta" });

// DeepSeek with thinking
await LLM("solve this puzzle", { service: "deepseek", model: "deepseek-reasoner", think: true });

// Ollama (local)
await LLM("the color of the sky is", { model: "llama3.2:3b" });
```

Being able to quickly switch between LLMs prevents you from getting locked in.

## Parsers

`LLM.js` ships with helpful parsers that work with every LLM:

```javascript
// JSON Parsing
const colors = await LLM("Please return the primary colors in a JSON array", {
  parser: LLM.parsers.json
});
// ["red", "green", "blue"]

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

Parsers work seamlessly with streaming and extended responses.

## System Prompts

Create agents that specialize at specific tasks using `llm.system(input)`.

```javascript
const llm = new LLM();
llm.system("You are a friendly chat bot.");
await llm.chat("what's the color of the sky in hex value?"); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context)
```

## Message History

`LLM.js` supports simple string prompts, but also full message history:

```javascript
await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "assistant", content: "OK I will remember" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // Response: blue
```

The OpenAI message format is used, and converted on-the-fly for specific services that use a different format.

## API Documentation

For detailed API documentation including all options, methods, and TypeScript interfaces, see the [API Documentation](docs/index.html).

The main interfaces include:

* **LLM Class**: Core functionality for chat, streaming, and configuration
* **Options**: All available configuration options 
* **Response Types**: Regular, streaming, and extended response formats
* **Tools**: Function calling capabilities
* **Usage Tracking**: Token and cost information

## Examples

The [test suite](https://github.com/themaximalist/llm.js/tree/main/test) contains comprehensive examples of all features in action, including:

## Debug

`LLM.js` uses the `debug` npm module with the `llm.js` namespace.

View debug logs by setting the `DEBUG` environment variable:

```bash
> DEBUG=llm.js* node your-script.js
# debug logs
blue
```

## Local and Remote Models

`LLM.js` seamlessly works with both local and remote models:

**Local Models** (free, private, offline):

* Ollama - Easy local model management
* Llamafile - Single-file model execution

**Remote Models** (fast, latest, no setup):

* OpenAI, Anthropic, Google - Industry-leading models
* Groq, xAI, DeepSeek - High-performance alternatives

All features work the same whether local or remote, with automatic cost tracking (local models show $0 cost).

## Projects

`LLM.js` is currently used in production by:

-   [AI.js](https://aijs.themaximalist.com) — simple AI library
-   [Infinity Arcade](https://infinityarcade.com) — play any text adventure game
-   [News Score](https://newsscore.com) — score and sort the news
-   [AI Image Explorer](https://aiimageexplorer.com) — image explorer
-   [Think Machine](https://thinkmachine.com) — AI research assistant
-   [Thinkable Type](https://thinkabletype.com) — Information Architecture Language

## Changelog

* 01/15/2025 — `v1.0.0-beta.8` — Added thinking mode, extended responses, token/cost usage, model management
* 01/27/2025 — `v0.8.0` — Added DeepSeek
* 12/19/2024 — `v0.7.1` — Fixed Anthropic streaming bug
* 10/25/2024 — `v0.7.0` — Added Perplexity, upgraded all models to latest
* 04/24/2024 — `v0.6.6` — Added browser support
* 04/18/2024 — `v0.6.5` — Added Llama 3 and Together
* 03/25/2024 — `v0.6.4` — Added Groq and abort()
* 03/17/2024 — `v0.6.3` — Added JSON/XML/Markdown parsers and a stream handler
* 03/15/2024 — `v0.6.2` — Fix bug with Google streaming
* 03/15/2024 — `v0.6.1` — Fix bug to not add empty responses
* 03/04/2024 — `v0.6.0` — Added Anthropic Claude 3
* 03/02/2024 — `v0.5.9` — Added Ollama
* 02/15/2024 — `v0.5.4` — Added Google Gemini
* 02/13/2024 — `v0.5.3` — Added Mistral
* 01/15/2024 — `v0.5.0` — Created website
* 01/12/2024 — `v0.4.7` — OpenAI Tools, JSON stream
* 01/07/2024 — `v0.3.5` — Added ModelDeployer
* 01/05/2024 — `v0.3.2` — Added Llamafile
* 04/26/2023 — `v0.2.5` — Added Anthropic, CLI
* 04/24/2023 — `v0.2.4` — Chat options
* 04/23/2023 — `v0.2.2` — Unified LLM() interface, streaming
* 04/22/2023 — `v0.1.2` — Docs, system prompt
* 04/21/2023 — `v0.0.1` — Created LLM.js with OpenAI support

## License

MIT

## Author

Created by [The Maximalist](https://twitter.com/themaximal1st), see our [open-source projects](https://themaximalist.com/products).

