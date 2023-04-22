# llm.js

llm.js provides a simple way to interact with OpenAI's (and soon Anthropic)
GPT-based language models. This module includes functions for sending chat
messages, generating AI responses, and streaming AI responses for real-time
interactions.

## Example

```javascript
const { AI } = require("@themaximalist/llm.js");
console.log(await AI("The color of the sky is")); // blue
```

## Installation

To install the package, run:

```bash
npm install @themaximalist/llm.js
```

## Configuration

To use this module, you will need an API key from OpenAI. Set
the`OPENAI_API_KEY` environment variable with your API key:

```bash
export OPENAI_API_KEY=<your-openai-api-key>
```

You can also pass in an `api_key` to any function. This is especially helpful if
you need to manage multiple API keys (say one for `gpt-4` and one for
`gpt-3.5-turbo`).

You can specify the model with `LLM_MODEL` as an environment variable.

```bash
export LLM_MODEL=gpt-3.5-turbo
```

Or no `LLM_MODEL` environment variable is set, and no `model` is passed to
functions, `gpt-3.5-turbo` is used.

## AI

> _Request to LLM with no context._

**`AI(input, model, api_key)`** generates a response based on input message.

```javascript
const { AI } = require("@themaximalist/llm.js");
console.log(await AI("The color of the sky is")); // blue
```

## Agent

> _Request to LLM with pre-defined system prompt._

**`Agent(prompt, input, model, api_key)`** generates a response based on a
prompt and input message.

```javascript
const { Agent } = require("@themaximalist/llm.js");
const response = await Agent(
    "I am HEX-Bot, I generate beautiful color schemes based on user input",
    "green tree"
);
console.log(response);
```

## Completion

> _Request to LLM with explicit memory (message history)._

**Completion(messages, model, api_key)** generates a response based on an array of
messages (in the format `[{ role , content }]`), `role` can be `system`, `user`,
or `assistant`.

```javascript
const { Completion } = require("@themaximalist/llm.js");
const response = await Completion([
    { role: "user", content: "the codeword is blue" },
    { role: "user", content: "what is the codeword?" },
]);
console.log(response);
```

## Chat

> _Request to LLM with implicit memory (message history). Reponses are
> automatically saved._

**Chat**: A class that helps manage chat history for multi-turn
conversations. It has the following methods:

-   `constructor(model, api_key)`: Initialize chat history with model and api
    key
-   `user(content)`: Add a user message to the chat history.
-   `assistant(content)`: Add an assistant message to the chat history.
-   `system(content)`: Add a system message to the chat history.
-   `async chat(content)`: Add a user message and get an assistant response.
-   `async send()`: Send the chat history to the AI and get an assistant
    response.

```javascript
const { Chat } = require("@themaximalist/llm.js");
const chat = new Chat();
chat.user("the codeword is blue");
const response = await chat.chat("what is the codeword?");
console.log(response);
```

## StreamCompletion

> _Request to LLM with streaming tokens. Pass in optional `parser` option to
> parse stream of tokens._

**\*StreamCompletion(messages, parser=null, model, api_key)** returns a generator that
streams AI-generated tokens in real-time based on an array of messages. Format
is same as `Completion`.

```javascript
const { StreamCompletion } = require("@themaximalist/llm.js");
const messages = [
    {
        role: "user",
        content: "tell me a story using dan harmon's story structure",
    },
];
for await (const token of StreamCompletion(messages)) {
    process.stdout.write(token.toString());
}
```

To see a live custom implementation of stream parsing, look into how
[Infinity Arcade](https://github.com/themaximal1st/InfinityArcade/blob/main/src/services/parseTokenStream.js)
uses `StreamCompletion` to parse options out of a response.

## TODO

-   Implement Anthropic models on top of same interface (message history data
    format is different)

## About

https://themaximalist.com

https://twitter.com/themaximal1st

## License

llm.js is licensed under the MIT License.
