function createAPI() {
    const { Configuration, OpenAIApi } = require("openai");
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    return new OpenAIApi(configuration);
}

let openai = null;
async function completion(messages, options = {}) {
    if (!openai) openai = createAPI();
    if (!options) options = {};
    if (!options.model) options.model = "gpt-3.5-turbo";
    if (!Array.isArray(messages)) throw new Error(`openai.completion() expected array of messages`);

    const response = await openai.createChatCompletion({
        messages,
        model: options.model,
    });

    if (options.stream) {
    } else {
        return response.data.choices[0].message.content.trim();
    }
}

module.exports = completion;
// stream
// parser
// assistant response

/*
let openai = null;

if (process.env.OPENAI_API_KEY) {
}

module.exports = openai;
*/

/*
    let parser = options.parser || this.parser || null;
    let networkOptions = {};
    if (this.stream) networkOptions.responseType = "stream";

    const completion = await openai.createChatCompletion({
        messages,
        model: this.model,
        stream: this.stream,
    }, networkOptions);

    if (this.stream) {
        if (!parser) parser = parseStream;
        return parser(completion, (content) => {
            this.assistant(content);
        });
    } else {
        let content = completion.data.choices[0].message.content.trim();
        if (parser) content = parser(content);
        this.assistant(content);
        return content;
    }
    */