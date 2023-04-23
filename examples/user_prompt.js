const LLM = require("../index.js");

(async function () {
    const stream = await LLM.user("You are HexBot, you generate pretty hex colors from my input", "green tree", { stream: true });
    for await (const message of stream) {
        process.stdout.write(message);
    }
})();