const LLM = require("../index.js");

(async function () {
    const stream = await LLM.system("I am HexBot, I generate pretty hex colors from user input", "green tree", { stream: true });
    for await (const message of stream) {
        process.stdout.write(message);
    }
})();