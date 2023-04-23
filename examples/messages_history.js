const LLM = require("../index.js");

(async function () {
    const llm = new LLM([
        { role: "user", content: "remember the secret codeword is blue" },
        { role: "user", content: "what is the secret codeword I just told you?" },
    ]);

    let content;
    content = await llm.fetch();
    console.log(content); // blue

    llm.user("now the codeword is red");
    content = await llm.chat("what is the codeword I just told you?");
    console.log(content); // red
})();