let anthropic = null;

if (process.env.ANTHROPIC_API_KEY) {
    const { Client } = require("@anthropic-ai/sdk");
    anthropic = new Client(process.env.ANTRHOPIC_API_KEY);
}

module.exports = anthropic;