# LLM.js

<img src="llm.png" alt="llm" width="300" />

<div class="badges" style="text-align: center">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/themaximal1st/llm.js">
<img alt="NPM Downloads" src="https://img.shields.io/npm/dt/%40themaximalist%2Fllm.js">
<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/themaximal1st/llm.js">
<img alt="GitHub License" src="https://img.shields.io/github/license/themaximal1st/llm.js">
</div>
<br />

**`LLM.js`** is an easy way to use dozens of popular Large Language Models in Node.js. It works out of the box with:

* [GPT-4](https://platform.openai.com/docs/api-reference/chat) and GPT-3.5 from OpenAI
* [Gemini](https://deepmind.google/technologies/gemini/) from Google
* [Claude](https://docs.anthropic.com/claude/reference/getting-started-with-the-api) from Anthropic
* [Mistral](https://docs.mistral.ai/) from Mistral AI
* [LLaMa](https://github.com/Mozilla-Ocho/llamafile) from Facebook
* ...and more

```javascript
await LLM("the color of the sky is"); // blue
```

**Features**

- Easy to use
- Same interface for all providers (`openai`, `google`, `anthropic`, `mistral`, `llamafile`, `modeldeployer`)
- Chat History
- JSON Schema
- Streaming
- **`llm`** CLI to use in your shell
- Host a remote API, track costs, rate limit users, manage API keys with [Model Deployer](https://github.com/themaximal1st/ModelDeployer)
- MIT license



## Install

Installing `LLM.js` is easy:

```bash
npm install @themaximalist/llm.js
```

Setting up providers is easy—just make sure your API key is set in your environment

```bash
export OPENAI_API_KEY=...
export ANTHROPIC_API_KEY=...
export MISTRAL_API_KEY=...
export GOOGLE_API_KEY=...
```

For local models like llamafile, ensure an instance is running.

### Prompt

The simplest way to call `LLM.js` is directly as an `async function`, using a `string` as a parameter.

```javascript
const LLM = require("@themaximalist/llm.js");
await LLM("hello"); // Response: hi
```



### Chat

You can also initialize an LLM instance and build up chat history.

```javascript
const llm = new LLM("what's the color of the sky in hex value?");
await llm.send(); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context to know we're asking for a color)
```



### System prompts

Create agents that specialize at specific tasks using `llm.system(input)`. Note OpenAI has suggested system prompts may not be as effective as user prompts (`llm.user(input)`).

```javascript
const llm = new LLM();
llm.system("You are a friendly chat bot.");
await llm.chat("what's the color of the sky in hex value?"); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context to know we're asking for a color)
```



### Streaming

Streaming is as easy as passing `{stream: true}` as the second options parameter.

```javascript
const stream = await LLM("the color of the sky is", { stream: true });
for await (const message of stream) {
    process.stdout.write(message);
}
```



### History

`LLM.js` supports passing historical messages in as the first parameter to `await LLM()` or `new LLM()` — letting you continue a previous conversation, or steer the AI model in a more precise way.

```javascript
await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // Response: blue
```

The OpenAI message format is used, and converted on-the-fly for specific services that use a different format (like Anthropic, Google and LLaMa).



## JSON Schema

`LLM.js` supports JSON schema in OpenAI and LLaMa.

```javascript
const schema = {
    "type": "object",
    "properties": {
        "colors": { "type": "array", "items": { "type": "string" } }
    }
}

const obj = await LLM("what are the 3 primary colors in JSON format?", { schema, temperature: 0.1, service: "openai" });
```

LLaMa uses a different format internally (BNFS), but it's automatically converted from JSON Schema. Note JSON Schema can produce invalid JSON, especially if the model cuts off in the middle (due to `max_tokens`).



## Switch LLM Services

`LLM.js` supports most popular Large Lanuage Models, including

* [OpenAI](https://platform.openai.com/docs/models/): `gpt-4-turbo-preview`, `gpt-4`, `gpt-3.5-turbo`
* [Google](https://deepmind.google/technologies/gemini/): `gemini-pro`
* [Anthropic](https://docs.anthropic.com/claude/reference/selecting-a-model): `claude-2.1`, `claude-instant-1.2`
* [Mistral](https://docs.mistral.ai/platform/endpoints/): `mistral-medium`, `mistral-small`, `mistral-tiny`
* [llamafile](https://github.com/Mozilla-Ocho/llamafile): `LLaVa 1.5`, `Mistral-7B-Instruct`, `Mixtral-8x7B-Instruct`, `WizardCoder-Python-34B`, `TinyLlama-1.1B`, `Phi-2`, ...
* [Model Deployer](https://modeldeployer.themaximalist.com/): Deploy any of the models `LLM.js` supports in production with usage tracking and rate limiting

`llamafile` is a local model format that can run dozens of models—and the other services are remote APIs that require an API key.

`LLM.js` is smart enough to guess the service based on the model, or you can specify it explicitly.

```javascript
await LLM("the color of the sky is"); // defaults to Llamafile
await LLM("the color of the sky is", { model: "gpt-4-turbo-preview" }); // automatically knows to use OpenAI
await LLM("the color of the sky is", { model: "claude-2.1" }); // automatically knows to use Anthropic
await LLM("the color of the sky is", { model: "mistral-tiny" }); // automatically knows to use Mistral AI
await LLM("the color of the sky is", { model: "gemini-pro" }); // automatically knows to use Googl

await LLM("the color of the sky is", { service: "openai", model: "gpt-3.5-turbo" }); // set service explicitly

await LLM("the color of the sky is", { service: "modeldeployer", model: "api-key" }); // proxies through deployed service you control
```

Being able to easily switch between LLM services and providers enables you to not get locked in.



## Deploy Models

[Model Deployer](https://github.com/themaximal1st/ModelDeployer) lets you call LLM.js through a remote API. It manages your models, api keys, and provides a central API for all of them so you can easily use LLMs in your apps.

It can rate limit users, track API costs—and it's extremely simple:

```javascript
await LLM("hello world", { service: "modeldeployer", model: "model-api-key-goes-here" });
```

Model Deployer also lets you setup API keys with specific settings, and optionally override them on the client.

```javascript
await LLM("the color of the sky is usually", { service: "modeldeployer", model: "model-api-key-goes-here", endpoint: "https://example.com/api/v1/chat", max_tokens: 1, temperature: 0 });
```

`LLM.js` can be used without Model Deployer, but if you're deploying LLMs to production it's a great way to manage them.



## `LLM` Command

`LLM.js` provides a handy `llm` command that can be invoked from your shell. This is an extremely convenient way to call models and services with the full power of `LLM.js`. Access it globally by installing `npm install @themaximalist/llm.js -g` or setting up an `nvm` environment.

```bash
> llm the color of the sky is
blue
```

Messages are streamed back in real time.

You can also initiate a `--chat` to remember message history and continue your conversation. `Ctrl-C` to quit.

```bash
> llm remember the codeword is blue. say ok if you understand --chat
OK, I understand.
> what is the codeword?
The codeword is blue.
```

Model and service can be specified on the fly

```bash
> llm the color of the sky is --model claude-v2
blue
```



## Debug

`LLM.js` and `llm` use the `debug` npm module with the `llm.js` namespace, so you can view debug logs by setting the `DEBUG` environment variable.

```bash
> DEBUG=llm.js* llm the color of the sky is
# debug logs
blue
> export DEBUG=llm.js*
> llm the color of the sky is
# debug logs
blue
```



## Projects

`LLM.js` is currently used in the following projects:

-   [AI.js](https://aijs.themaximalist.com) — simple AI library
-   [Infinity Arcade](https://infinityarcade.com) — play any text adventure game
-   [News Score](https://newsscore.com) — score and sort the news
-   [Images Bot](https://imagesbot.com) — image explorer
-   [Model Deployer](https://modeldeployer.com) — deploy AI models in production
-   [HyperType](https://hypertypelang.com) — knowledge graph toolkit
-   [HyperTyper](https://hypertyper.com) — multidimensional mind mapping



## Author

-   [The Maximalist](https://themaximalist.com/)
-   [@themaximal1st](https://twitter.com/themaximal1st)



## License

MIT
