# LLM.js

<img src="llm.png" alt="llm" style="zoom:70%;" />

**`LLM.js`** is the simplest way to interact with Large Language Models (LLM) like OpenAI's `gpt-3.5-turbo`, `gpt-4`, and Anthropic's `Claude` (soon). It offers a convenient interface for developers to use LLMs in their Node.js projects.

```javascript
await LLM("the color of the sky is"); // blue
```

**Features**

-   Easy to use
-   Automatically manage chat history
-   Streaming
-   Manage context window size
-   MIT license

_LLM.js is under heavy development and still subject to breaking changes._



## Install

Make sure you have `OPENAI_API_KEY` set in your environment variables.

```bash
npm install @themaximalist/llm.js
export OPENAI_API_KEY=...
```



## Usage

### Simple completion

The simplest way to call `LLM.js` is directly as an `async function`, using a `string` as a parameter. This performs a single request and doesn't store any history.

```javascript
const LLM = require("@themaximalist/llm.js");
await LLM("hello"); // Response: hi
```



### Completion with history

Storing history is as simple as initializing with `new LLM()`. Call `fetch()` to send the current state for completion, and `chat()` to update the messages and fetch in one command. Both chats from the `user` and responses from the AI `assistant` are stored automatically.

```javascript
const llm = new LLM("what's the color of the sky in hex value?");
await llm.fetch(); // Response: sky blue
await llm.chat("what about at night time?"); // Response: darker value (uses previous context to know we're asking for a color)
```



### System prompts

Create agents that specialize at specific tasks using
`LLM.system(prompt, input)`. Note OpenAI has suggested system prompts may not be
as effective as user prompts (`LLM.user(prompt, input)`). These are one-time use
AI's because they don't story the message history.

```javascript
await LLM.system("I am HexBot, I imagine colors and return hex values", "sky"); // Response: sky blue
await LLM.system(
    "I am HexBot, I imagine colors and return hex values",
    "sky at night"
); // Response: darker
```



### System prompts with history

Storing message history with system prompts is easy—just initialize a `new LLM()` and call `system()` to initialize a system prompt. A network request is not sent until `fetch()` or `chat()` is called—so you can build up examples for the AI with a combination of `system()`, `user()`, and `assistant()`—or keep an agent running for a long time with context of previous conversations.

```javascript
const llm = new LLM();
llm.system("I am HexBot, I imagine colors and return hex values");
await llm.chat("sky"); // Response: sky blue
await llm.chat("lighter"); // Response: lighter sky blue (has previous context to know what we mean)
```

Here's a user prompt example:

```javascript
const llm = new LLM();
llm.user("remember the secret codeword is blue");
await llm.chat("what is the secret codeword I just told you?"); // Response: blue
llm.user("now the codeword is red");
await llm.chat("what is the secret codeword I just told you?"); // Response: red
await llm.chat("what was the first secret codeword I told you?"); // Response: blue
```



### Streaming completions

Streaming is as easy as passing `{stream: true}` as the second options parameter. A generator is returned that yields the completion tokens in real-time.

```javascript
const stream = await LLM("the color of the sky is", { stream: true });
for await (const message of stream) {
    process.stdout.write(message);
}
```



### Messages with simple interaction

So far every input to `LLM()` has been a `string`, but you can also send an array of previous messages. The same `await LLM()`/`new LLM()` interface works as expected, as does streaming, etc...

```javascript
await LLM([
    { role: "user", content: "remember the secret codeword is blue" },
    { role: "user", content: "what is the secret codeword I just told you?" },
]); // Response: blue
```



## Fetch Context

When sending message history for completion, managing long conversations will
eventually run into a size limit. There are a few helpful `context` options you
can pass into `fetch()`.

```javascript
const llm = new LLM([...]);
await llm.fetch({context: LLM.CONTEXT_FIRST}); // send first message
await llm.fetch({context: LLM.CONTEXT_LAST}); // send last message
await llm.fetch({context: LLM.CONTEXT_OUTSIDE}); // send first and last messages
await llm.fetch({context: LLM.CONTEXT_FULL}); // send everything (default)
```



## API

The simplest interface to `LLM.js` is calling `await LLM()`

```javascript
await LLM(input<string|array>, options={
   model: "gpt-3.5-turbo",
   stream: false
});
```

To store message history, call `new LLM()` to initiate the `AI` object.

```javascript
new LLM(input<string|array>, options={
   model: "gpt-3.5-turbo",
   stream: false
});
```

#### LLM() Instance Methods

-   **LLM.fetch({context: LLM.CONTEXT_FULL, stream: false, streamParser: null})** send network request for completion. See `context` docs above and [Infinity Arcade](https://github.com/themaximal1st/InfinityArcade/blob/main/src/services/parseTokenStream.js) for a custom stream parser implementation.
-   **LLM.user(content)** add user content
-   **LLM.system(content)** add system content
-   **LLM.assistant(content)** add assistant content
-   **LLM.chat(content)** add user content and send `fetch`
-   **LLM.messages[]** message history
-   **LLM.lastMessage**

#### LLM() Static Methods

-   **LLM.system(prompt, input, options)** helper for one-time use system prompt
-   **LLM.user(prompt, input, options)** helper for one-time use user prompt



## Projects

`LLM.js` is currently used in the following projects:

-   [Infinity Arcade](https://infinityarcade.com)



## Author

-   [The Maximalist](https://themaximalist.com/)
-   [@themaximal1st](https://twitter.com/themaximal1st)



## License

MIT
