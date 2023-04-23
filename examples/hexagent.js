const HexAgent = require("./agents/HexAgent");

(async function () {
    let color;

    color = await HexAgent("the color of the sky is");
    console.log(color); // #87ceeb sky blue

    color = await HexAgent("the color of the sky at night is");
    console.log(color); // darker
})();