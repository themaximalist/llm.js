#!/usr/bin/env node
import debug from "debug";
const log = debug("llm.js:cli");

import { Command } from "commander";
import PromptSync from "prompt-sync";
import PrompSyncHistory from "prompt-sync-history";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prompt = PromptSync({
    sigint: true,
    history: PrompSyncHistory(),
});

import fs from "fs";

const packagejson = JSON.parse(fs.readFileSync(join(__dirname, "../package.json"), "utf8"));

const program = new Command();

import LLM from "./index.js";

async function run(input, options) {
    log(`running llm.js CLI with input: ${input}, options: ${JSON.stringify(options)}`);

    options.stream = true;

    const llm = new LLM([], options);

    if (input.length > 0) {
        llm.user(input);
        for await (const token of await llm.send()) {
            if (token) {
                process.stdout.write(token);
            }
        }
        process.stdout.write("\n");
    }

    if (options.chat) {
        while (true) {
            input = prompt("> ");
            if (!input) { continue }

            for await (const token of await llm.chat(input)) {
                if (token) {
                    process.stdout.write(token);
                }
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
    .option('-s, --service <service>', 'Completion Service (default: llamafile)')
    .option('-t, --temperature <number>', 'Model temperature (default 0.8)', parseFloat, 0.8)
    .option('-c, --chat', 'Chat Mode')
    .argument('[input]', 'Input to send to LLM service')
    .action((_, options) => {

        let input;
        try {
            const stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
            input = stdinBuffer.toString();
        } catch (e) {
            input = program.args.join(" ").trim();
        }

        if (!options.chat && !input) {
            program.help();
            process.exit();
        }

        run(input, options);
    });

program.parse(process.argv);