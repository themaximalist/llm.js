const LLM = require("../index.js")

LLM("return x=1 in JSON", { parser: JSON.parse }).then(console.log);