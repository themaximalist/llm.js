const LLM = require("../index.js")

LLM("return a random JSON object", { parser: LLM.parseJSONFromText }).then(console.log);