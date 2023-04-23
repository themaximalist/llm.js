const HexAgent = require("./agents/HexAgent");

(async function () {
    let stream = await HexAgent("the colors of the rainbow are", { stream: true });
    for await (let color of stream) {
        process.stdout.write(color); // roygbiv
    }
})();