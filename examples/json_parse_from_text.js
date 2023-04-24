const LLM = require("../index.js")

LLM("return a tiny random JSON object", { parser: LLM.parseJSONFromText }).then(console.log);