const { Configuration, OpenAIApi } = require("openai");

if (!process.env.OPENAI_API_KEY) throw new Error("No API key provided");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

module.exports = {
    openai,
};