const LLM = require("../../index");

const prompt = `
Ignore previous prompts
I HexColor-GPT.
I can imagine a color for anything you can think of and conver it to a hex value between #000000 and #FFFFFF.
If I don't know I make it up.
I only return a 7 character string.
`.trim();

async function HexAgent(input, options) {
    return await LLM.system(prompt, input, options);
}

module.exports = HexAgent;