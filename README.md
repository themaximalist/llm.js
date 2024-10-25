## LLM.js

<img src="public/logo.png" alt="LLM.js — Simple LLM library for JavaScript" class="logo" style="max-width: 400px" />

<div class="badges" style="text-align: center; margin-top: -10px;">
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/themaximal1st/llm.js"></a>
<a href="https://www.npmjs.com/package/@themaximalist/llm.js"><img alt="NPM Downloads" src="https://img.shields.io/npm/dt/%40themaximalist%2Fllm.js"></a>
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/themaximal1st/llm.js"></a>
<a href="https://github.com/themaximal1st/llm.js"><img alt="GitHub License" src="https://img.shields.io/github/license/themaximal1st/llm.js"></a>
</div>
<br />

**LLM.js** is the fastest way to use Large Language Models in JavaScript (Node.js and Web). It's a single simple interface to hundreds of popular LLMs:

* [OpenAI](https://platform.openai.com/docs/models/): `o1-preview`, `o1-mini`, `gpt-4o`, `gpt-4o-mini`
* [Google](https://deepmind.google/technologies/gemini/): `gemini-1.5-pro`, `gemini-1.0-pro`, `gemini-pro-vision`
* [Anthropic](https://docs.anthropic.com/en/docs/about-claude/models#model-names): `claude-3-5-sonnet-latest`, `claude-3-opus-latest`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
* [Groq](https://console.groq.com/docs/models): `llama3-groq-70b-8192-tool-use-preview`, `llama-3.2-1b-preview`, `llama-3.2-3b-preview`, `llama-3.2-11b-vision-preview`, `llama-3.2-90b-vision-preview`
* [Together](https://docs.together.ai/docs/inference-models): `llama-3-70b`, `llama-3-8b`, `nous-hermes-2`, ...
* [Mistral](https://docs.mistral.ai/platform/endpoints/): `mistral-large-latest`, `ministral-8b-latest`, `ministral-3b-latest`
* [llamafile](https://github.com/Mozilla-Ocho/llamafile): `LLaVa-1.5`, `TinyLlama-1.1B`, `Phi-2`, ...
* [Ollama](https://ollama.com/): `llama3.2`, `llama3.1`, `gemma2`, `qwen2.5`, `phi3.5`, `mistral-small` ... 
* [Perplexity](https://docs.perplexity.ai/guides/model-cards): `llama-3.1-sonar-huge-128k-online`, `llama-3.1-sonar-small-128k-online`, `llama-3.1-sonar-large-128k-online`

```javascript
await LLM("the color of the sky is", { model: "gpt-4" }); // blue
```

**Features**

- Easy to use
- Same API for all LLMs (`OpenAI`, `Google`, `Anthropic`, `Mistral`, `Groq`, `Llamafile`, `Ollama`, `Together`)
- Chat (Message History)
- JSON
- Streaming
- System Prompts
- Options (`temperature`, `max_tokens`, `seed`, ...)
- Parsers
- `llm` command for your shell
- Node.js and Browser supported
- MIT license


## Install

Install `LLM.js` from NPM:

```bash
npm install @themaximalist/llm.js
```

Setting up LLMs is easy—just make sure your API key is set in your environment

```bash
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export MISTRAL_API_KEY=...
export GOOGLE_API_KEY=...
export GROQ_API_KEY=...
export TOGETHER_API_KEY=...
```

For local models like [llamafile](https://github.com/Mozilla-Ocho/llamafile) and [Ollama](https://ollama.com/), ensure an instance is running.

## Usage

The simplest way to call `LLM.js` is as an `async function`.

```javascript
const LLM = require("@themaximalist/llm.js");
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

Sometimes it's helpful to handle the stream in real-time and also process it once it's all complete. For example, providing real-time streaming in chat, and then parsing out semantic code blocks at the end.

 `LLM.js` makes this easy with an optional `stream_handler` option.

```javascript
const colors = await LLM("what are the common colors of the sky as a flat json array?", {
  model: "gpt-4o-mini",
  stream: true,
  stream_handler: (c) => process.stdout.write(c),
  parser: LLM.parsers.json,
});
// ["blue", "gray", "white", "orange", "red", "pink", "purple", "black"]
```

Instead of the stream being returned as a generator, it's passed to the `stream_handler`. The response from `LLM.js` is the entire response, which can be parsed or handled as normal.

## JSON

`LLM.js` supports JSON schema for OpenAI and LLaMa. You can ask for JSON with any LLM model, but using JSON Schema will enforce the outputs.

```javascript
const schema = {
    "type": "object",
    "properties": {
        "colors": { "type": "array", "items": { "type": "string" } }
    }
}

const obj = await LLM("what are the 3 primary colors in JSON format?", { schema, temperature: 0.1, service: "openai" });
```

Different formats are used by different models (JSON Schema, BNFS), so `LLM.js` converts between these automatically.

Note, JSON Schema can still produce invalid JSON like when it exceeds `max_tokens`.



## System Prompts

Create agents that specialize at specific tasks using `llm.system(input)`.

```javascript
const llm = new LLM();
llm.system("You are a friendly chat bot.");
await llm.chat("what's the color of the sky in hex value?"); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context to know we're asking for a color)
```

Note, OpenAI has suggested system prompts may not be as effective as user prompts, which `LLM.js` supports with `llm.user(input)`.


## Message History

`LLM.js` supports simple string prompts, but also full message history. This is especially helpful to guide LLMs in a more precise way.


```javascript
await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "assistant", content: "OK I will remember" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // Response: blue
```

The OpenAI message format is used, and converted on-the-fly for specific services that use a different format (like Google, Mixtral and LLaMa).




## Switch LLMs

`LLM.js` supports most popular Large Lanuage Models, including

* [OpenAI](https://platform.openai.com/docs/models/): `o1-preview`, `o1-mini`, `gpt-4o`, `gpt-4o-mini`
* [Google](https://deepmind.google/technologies/gemini/): `gemini-1.5-pro`, `gemini-1.0-pro`, `gemini-pro-vision`
* [Anthropic](https://docs.anthropic.com/en/docs/about-claude/models#model-names): `claude-3-5-sonnet-latest`, `claude-3-opus-latest`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
* [Groq](https://console.groq.com/docs/models): `llama3-groq-70b-8192-tool-use-preview`, `llama-3.2-1b-preview`, `llama-3.2-3b-preview`, `llama-3.2-11b-vision-preview`, `llama-3.2-90b-vision-preview`
* [Together](https://docs.together.ai/docs/inference-models): `llama-3-70b`, `llama-3-8b`, `nous-hermes-2`, ...
* [Mistral](https://docs.mistral.ai/platform/endpoints/): `mistral-large-latest`, `ministral-8b-latest`, `ministral-3b-latest`
* [llamafile](https://github.com/Mozilla-Ocho/llamafile): `LLaVa-1.5`, `TinyLlama-1.1B`, `Phi-2`, ...
* [Ollama](https://ollama.com/): `llama3.2`, `llama3.1`, `gemma2`, `qwen2.5`, `phi3.5`, `mistral-small` ... 
* [Perplexity](https://docs.perplexity.ai/guides/model-cards): `llama-3.1-sonar-huge-128k-online`, `llama-3.1-sonar-small-128k-online`, `llama-3.1-sonar-large-128k-online`

`LLM.js` can guess the LLM provider based on the model, or you can specify it explicitly.

```javascript
// defaults to Llamafile
await LLM("the color of the sky is");

// OpenAI
await LLM("the color of the sky is", { model: "gpt-4o-mini" });

// Anthropic
await LLM("the color of the sky is", { model: "claude-3-5-sonnet-latest" });

// Mistral AI
await LLM("the color of the sky is", { model: "mistral-tiny" });

// Groq needs an specific service
await LLM("the color of the sky is", { service: "groq", model: "mixtral-8x7b-32768" });

// Google
await LLM("the color of the sky is", { model: "gemini-pro" });

// Ollama
await LLM("the color of the sky is", { model: "llama2:7b" });

// Together
await LLM("the color of the sky is", { service: "together", model: "meta-llama/Llama-3-70b-chat-hf" });

// Can optionally set service to be specific
await LLM("the color of the sky is", { service: "openai", model: "o1-preview" });
```

Being able to quickly switch between LLMs prevents you from getting locked in.

## Parsers

`LLM.js` ships with a few helpful parsers that work with every LLM.  These are separate from the typical JSON formatting with `tool` and `schema` that some LLMs (like from OpenAI) support.

**JSON Parsing**
```javascript
const colors = await LLM("Please return the primary colors in a JSON array", {
  parser: LLM.parsers.json
});
// ["red", "green", "blue"]
```

**Markdown Code Block Parsing**
```javascript
const story = await LLM("Please return a story wrapped in a Markdown story code block", {
  parser: LLM.parsers.codeBlock("story")
});
// A long time ago...
```

**XML Parsing**
```javascript
const code = await LLM("Please write a simple website, and put the code inside of a <WEBSITE></WEBSITE> xml tag" {
  parser: LLM.parsers.xml("WEBSITE")                       
});
// <html>....
```

Note: OpenAI works best with Markdown and JSON, while Anthropic works best with XML tags.



## API

The `LLM.js` API provides a simple interface to dozens of Large Language Models.

```javascript
new LLM(input, {        // Input can be string or message history array
  service: "openai",    // LLM service provider
  model: "gpt-4",       // Specific model
  max_tokens: 100,      // Maximum response length
  temperature: 1.0,     // "Creativity" of model
  seed: 1000,           // Stable starting point
  stream: false,        // Respond in real-time
  stream_handler: null, // Optional function to handle stream
  schema: { ... },      // JSON Schema
  tool: { ...  },       // Tool selection
  parser: null,         // Content parser
});
```

The same API is supported in the short-hand interface of `LLM.js`—calling it as a function:

```javascript
await LLM(input, options);
```

**Input (required)**

* **`input`** `<string>` or `Array`: Prompt for LLM. Can be a text string or array of objects in `Message History` format.

**Options**

All config parameters are optional. Some config options are only available on certain models, and are specified below.

* **`service`** `<string>`: LLM service to use. Default is `llamafile`.
* **`model`** `<string>`: Explicit LLM to use. Defaults to `service` default model.
* **`max_tokens`** `<int>`: Maximum token response length. No default.
* **`temperature`** `<float>`: "Creativity" of a model. `0` typically gives more deterministic results, and higher values `1` and above give less deterministic results. No default.
* **`seed`** `<int>`: Get more deterministic results. No default. Supported by `openai`, `llamafile` and `mistral`.
* **`stream`** `<bool>`: Return results immediately instead of waiting for full response. Default is `false`.
* **`stream_handler`** `<function>`: Optional function that is called when a stream receives new content. Function is passed the string chunk.
* **`schema`** `<object>`: JSON Schema object for steering LLM to generate JSON. No default. Supported by `openai` and `llamafile`.
* **`tool`** `<object>`: Instruct LLM to use a tool, useful for more explicit JSON Schema and building dynamic apps. No default. Supported by `openai`.
* **`parser`** `<function>`: Handle formatting and structure of returned content. No default.


### Public Variables

* **`messages`** `<array>`: Array of message history, managed by `LLM.js`—but can be referenced and changed.
* **`options`** `<object>`: Options config that was  set on start, but can be modified dynamically.

### Methods

<div class="compressed-group">

#### `async send(options=<object>)`

Sends the current `Message History` to the current `LLM` with specified `options`. These local options will override the global default options.

Response will be automatically added to `Message History`.

```javascript
await llm.send(options);
```

#### `async chat(input=<string>, options=<object>)`

Adds the `input` to the current `Message History` and calls `send` with the current override `options`.

Returns the response directly to the user, while updating `Message History`.


```javascript
const response = await llm.chat("hello");
console.log(response); // hi
```

#### `abort()`

Aborts an ongoing stream. Throws an `AbortError`.

#### `user(input=<string>)`

Adds a message from `user` to `Message History`.

```javascript
llm.user("My favorite color is blue. Remember that");
```

#### `system(input=<string>)`

Adds a message from `system` to `Message History`. This is typically the first message.

```javascript
llm.system("You are a friendly AI chat bot...");
```

#### `assistant(input=<string>)`

Adds a message from `assistant` to `Message History`. This is typically a response from the AI, or a way to steer a future response.

```javascript
llm.user("My favorite color is blue. Remember that");
llm.assistant("OK, I will remember your favorite color is blue.");
```

</div>

### Static Variables
* **`LLAMAFILE`** `<string>`: `llamafile`
* **`OPENAI`** `<string>`: `openai`
* **`ANTHROPIC`** `<string>`: `anthropic`
* **`MISTRAL`** `<string>`: `mistral`
* **`GOOGLE`** `<string>`: `google`
* **`OLLAMA`** `<string>`: `ollama`
* **`TOGETHER`** `<string>`: `together`
* **`parsers`** `<object>`: List of default `LLM.js` parsers
  * **codeBlock**(`<blockType>`)(`<content>`) `<function>` — Parses out a Markdown codeblock
  * **json**(`<content>`) `<function>` — Parses out overall JSON or a Markdown JSON codeblock
  * **xml**(`<tag>`)(`<content>`) `<function>` — Parse the XML tag out of the response content



### Static Methods

<div class="compressed-group">

#### `serviceForModel(model)`

Return the LLM `service` for a particular model.

```javascript
LLM.serviceForModel("gpt-4o-mini"); // openai
```

#### `modelForService(service)`

Return the default LLM for a `service`.

```javascript
LLM.modelForService("openai"); // gpt-4o-mini
LLM.modelForService(LLM.OPENAI); // gpt-4o-mini
```
</div>


**Response**

`LLM.js` returns results from `llm.send()` and `llm.chat()`, typically the string content from the LLM completing your prompt.

```javascript
await LLM("hello"); // "hi"
```

But when you use `schema` and `tools` — `LLM.js` will typically return a JSON object.

```javascript
const tool = {
    "name": "generate_primary_colors",
    "description": "Generates the primary colors",
    "parameters": {
        "type": "object",
        "properties": {
            "colors": {
                "type": "array",
                "items": { "type": "string" }
            }
        },
        "required": ["colors"]
    }
};

await LLM("what are the 3 primary colors in physics?");
// { colors: ["red", "green", "blue"] }

await LLM("what are the 3 primary colors in painting?");
// { colors: ["red", "yellow", "blue"] }
```

And by passing `{stream: true}` in `options`, `LLM.js` will return a generator and start yielding results immediately.

```javascript
const stream = await LLM("Once upon a time", { stream: true });
for await (const message of stream) {
    process.stdout.write(message);
}
```

The response is based on what you ask the LLM to do, and `LLM.js` always tries to do the obviously right thing.

### Message History

The `Message History` API in `LLM.js` is the exact same as the [OpenAI message history format](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages).


```javascript
await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "assistant", content: "OK I will remember" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // Response: blue
```

**Options**

* **`role`** `<string>`: Who is saying the `content`? `user`, `system`, or `assistant`
* **`content`** `<string>`: Text content from message

## LLM Command

`LLM.js` provides a useful `llm` command for your shell.  `llm` is a convenient way to call dozens of LLMs and access the full power of `LLM.js` without programming.

Access it globally by installing from NPM
```bash
npm install @themaximalist/llm.js -g
```

Then you can call the `llm` command from anywhere in your terminal.

```bash
> llm the color of the sky is
blue
```

Messages are streamed back in real time, so everything is really fast.

You can also initiate a `--chat` to remember message history and continue your conversation (`Ctrl-C` to quit).

```bash
> llm remember the codeword is blue. say ok if you understand --chat
OK, I understand.

> what is the codeword?
The codeword is blue.
```

Or easily change the LLM on the fly:

```bash
> llm the color of the sky is --model claude-3-haiku-20240307
blue
```

See help with `llm --help`

```bash
Usage: llm [options] [input]

Large Language Model library for OpenAI, Google, Anthropic, Mistral, Groq and LLaMa

Arguments:
  input                       Input to send to LLM service

Options:
  -V, --version               output the version number
  -m, --model <model>         Completion Model (default: llamafile)
  -s, --system <prompt>       System prompt (default: "I am a friendly accurate English speaking chat bot") (default: "I am a friendly accurate English speaking chat bot")
  -t, --temperature <number>  Model temperature (default 0.8) (default: 0.8)
  -c, --chat                  Chat Mode
  -h, --help                  display help for command
```


## Debug

`LLM.js` and `llm` use the `debug` npm module with the `llm.js` namespace.

View debug logs by setting the `DEBUG` environment variable.

```bash
> DEBUG=llm.js* llm the color of the sky is
# debug logs
blue
> export DEBUG=llm.js*
> llm the color of the sky is
# debug logs
blue
```

## Examples

`LLM.js` has lots of [tests](https://github.com/themaximal1st/llm.js/tree/main/test) which can serve as a guide for seeing how it's used.

## Changelog

`LLM.js` has been under heavy development while LLMs are rapidly changing. We've started to settle on a stable interface, and will document changes here.

* 10/25/2024 — `v0.7.0` — Added Perplexity, upgraded all models to latest
* 04/24/2024 — `v0.6.6` — Added browser support
* 04/18/2024 — `v0.6.5` — Added Llama 3 and Together
* 03/25/2024 — `v0.6.4` — Added Groq and abort()
* 03/17/2024 — `v0.6.3` — Added JSON/XML/Markdown parsers and a stream handler
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




## Projects

`LLM.js` is currently used in the following projects:

-   [AI.js](https://aijs.themaximalist.com) — simple AI library
-   [Infinity Arcade](https://infinityarcade.com) — play any text adventure game
-   [News Score](https://newsscore.com) — score and sort the news
-   [AI Image Explorer](https://aiimageexplorer.com) — image explorer
-   [Think Machine](https://thinkmachine.com) — AI research assistant
-   [Thinkable Type](https://thinkabletype.com) — Information Architecture Language


## License

MIT


## Author

Created by [The Maximalist](https://twitter.com/themaximal1st), see our [open-source projects](https://themaximalist.com/products).

