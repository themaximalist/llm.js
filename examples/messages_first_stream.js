const LLM = require("../index.js");

(async function () {
    const llm = new LLM([
        { role: "user", content: "remember the secret codeword is blue" },
        { role: "user", content: "nevermind the codeword is red" },
        { role: "user", content: "what is the secret codeword I just told you?" },
    ], { stream: true });

    const stream = await llm.fetch({ context: LLM.CONTEXT_FIRST });
    for await (const message of stream) {
        process.stdout.write(message); // confused...doesn't know anything about a codeword
    }
})();