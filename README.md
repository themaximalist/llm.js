# llm.js

llm.js is a Node.js module that provides a convenient way to interact with OpenAI's (and soon Anthropic) GPT-based language models. This module includes functions for sending chat messages, generating AI responses, and streaming AI responses for real-time interactions.



## Installation

To install the package, run:

```bash
npm install llm.js
```



## Configuration

To use this module, you will need an API key from OpenAI. Set the
`OPENAI_API_KEY` environment variable with your API key:

```bash
export OPENAI_API_KEY=<your-openai-api-key>
```



## Usage

Here's an example of how to use the llm.js module:

```javascript
const { AI, Agent, Chat, ChatHistory, StreamChat } = require("./index.js");

(async function main() {
    let response;

    // AI
    response = await AI("What color is the sky?");
    console.log(response);

    // AGENT
    response = await Agent(
        "I am HEX bot, I generate beautiful color schemes based on user input",
        "Generate a color scheme of a green tree"
    );
    console.log(response);

    // CHAT
    response = await Chat([
        { role: "user", content: "the codeword is blue" },
        { role: "user", content: "what is the codeword?" },
    ]);
    console.log(response);

    // CHAT HISTORY
    let chat = new ChatHistory();
    chat.user("the codeword is blue");
    response = await chat.chat("what is the codeword?");
    console.log(response);

    // STREAM CHAT
    const messages = [
        {
            role: "user",
            content: "tell me a story using dan harmon's story structure",
        },
    ];
    for await (const token of StreamChat(messages)) {
        process.stdout.write(token.toString());
    }
})();
```



## API

The llm.js module exports the following functions and classes:

-   `Agent(prompt, input, model)`: Generates a response based on a prompt, an
    input message, and an optional model (default is `gpt-3.5-turbo`).
-   `AI(prompt, model)`: Generates a response based on a prompt and an optional
    model (default is `gpt-3.5-turbo`).
-   `Chat(messages, model)`: Generates a response based on an array of messages
    (in the format `[{ role: "user", content: "message" }]`) and an optional
    model (default is `gpt-3.5-turbo`).
-   `StreamChat(messages, model)`: Returns a generator that streams AI-generated
    tokens in real-time based on an array of messages (in the format
    `[{ role: "user", content: "message" }]`) and an optional model (default is
    `gpt-3.5-turbo`).
-   `ChatHistory`: A class that helps manage chat history for multi-turn
    conversations. It has the following methods:
    -   `user(content)`: Add a user message to the chat history.
    -   `assistant(content)`: Add an assistant message to the chat history.
    -   `system(content)`: Add a system message to the chat history.
    -   `chat(content)`: Add a user message and get an assistant response.
    -   `send()`: Send the chat history to the AI and get an assistant response.



## About

https://themaximalist.com

https://twitter.com/themaximal1st

## License

llm.js is licensed under the MIT License.
