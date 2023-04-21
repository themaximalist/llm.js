const { AI, Agent, Chat, ChatHistory, StreamChat } = require("./index.js");

(async function main() {
    let response;

    // AI
    response = await AI("What color is the sky?");
    console.log(response);

    // AGENT
    response = await Agent("I am HEX bot, I generate beautiful color schemes based on user input", "green tree");
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
        { role: "user", content: "tell me a short story using dan harmon's story structure" },
    ];
    for await (const token of StreamChat(messages)) {
        process.stdout.write(token.toString());
    }
})();