#!/usr/bin/env node
const log = require("debug")("llm.js:cli");
const { Command } = require("commander");
const prompt = require("prompt-sync")({
    sigint: true,
    history: require("prompt-sync-history")()
});
const packagejson = require("./package.json");
const program = new Command();

const LLM = require("./index");

async function run(input, options) {
    log(`running llm.js CLI with input: ${input}, options: ${JSON.stringify(options)}`);

    options.stream = true;
    if (options.chat) {
        const llm = new LLM(input, options);
        while (true) {
            const stream = await llm.fetch(options);
            for await (const token of stream) {
                process.stdout.write(token);
            }
            process.stdout.write("\n");
            const input = prompt("> ");
            llm.user(input);
        }
    } else {
        const stream = await LLM(input, options);
        for await (const token of stream) {
            process.stdout.write(token);
        }
        process.stdout.write("\n");
    }
}

program
    .name("llm")
    .description(packagejson.description)
    .version(packagejson.version)

program
    .option('-s, --service <service>', 'LLM Service (default: openai)')
    .option('-m, --model <model>', 'Completion Model (default: gpt-3.5-turbo)')
    .option('-c, --chat', 'Chat Mode')
    .argument('[input]', 'Input to send to LLM service')
    .action((input, options) => {
        if (!input) {
            program.help();
            return;
        }

        input = program.args.join(" ");

        run(input, options);
    });

program.parse(process.argv);