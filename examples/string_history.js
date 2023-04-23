const LLM = require("../index.js");

(async function () {
    const llm = new LLM("remember the codeword is 'blue'");
    let content;

    content = await llm.chat("what is the codeword I just told you to remember?");
    console.log(content); // blue

    llm.user("the codeword is now red")
    content = await llm.chat("what is the codeword I just told you to remember?")
    console.log(content); // red

    content = await llm.chat("what was the first codeword I told you to remember?");
    console.log(content); // blue
})();