#!/usr/bin/env node
import debug from "debug";
const log = debug("llm.js:cli");

import { Command } from "commander";
import PromptSync from "prompt-sync";
import PrompSyncHistory from "prompt-sync-history";

const prompt = PromptSync({
    sigint: true,
    history: PrompSyncHistory(),
});

import fs from "fs";
const packagejson = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const program = new Command();

import LLM from "./index.js";

async function run(input, options) {
    log(`running llm.js CLI with input: ${input}, options: ${JSON.stringify(options)}`);

    options.stream = true;

    const llm = new LLM([], options);

    llm.system(options.system);

    if (input.length > 0) {
        llm.user(input);
        for await (const token of await llm.send()) {
            process.stdout.write(token);
        }
        process.stdout.write("\n");
    }

    if (options.chat) {
        while (true) {
            input = prompt("> ");
            if (!input) { continue }

            for await (const token of await llm.chat(input)) {
                process.stdout.write(token);
            }

            process.stdout.write("\n");
        }
    }
}

program
    .name("llm")
    .description(packagejson.description)
    .version(packagejson.version)

program
    .option('-m, --model <model>', 'Completion Model (default: llamafile)')
    .option('-s, --system <prompt>', 'System prompt (default: "I am a friendly accurate English speaking chat bot")', 'I am a friendly accurate English speaking chat bot')
    .option('-t, --temperature <number>', 'Model temperature (default 0.8)', parseFloat, 0.8)
    .option('-c, --chat', 'Chat Mode')
    .argument('[input]', 'Input to send to LLM service')
    .action((_, options) => {
        const input = program.args.join(" ").trim();

        if (!options.chat && !input) {
            program.help();
            process.exit();
        }

        run(input, options);
    });

program.parse(process.argv);