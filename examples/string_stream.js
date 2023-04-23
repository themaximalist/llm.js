const LLM = require("../index.js");

(async function () {
    const stream = await LLM("the color of the sky is", { stream: true });
    for await (const message of stream) {
        process.stdout.write(message);
    }
})();