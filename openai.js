const log = require("debug")("llm.js:index");

const { Configuration, OpenAIApi } = require("openai");

const apis = {};
function get(api_key) {
    if (apis[api_key]) return apis[api_key];

    log(`creating new OpenAI API instance`);

    const configuration = new Configuration({
        apiKey: api_key
    });

    const openai = new OpenAIApi(configuration);
    apis[api_key] = openai;
    return openai;
}

module.exports = { get };