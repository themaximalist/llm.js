
import assert from "assert";
import LLM from "../src/index.js";
import { delay } from "../src/utils.js";

import { Agent } from "../src/agents.js";
import { Calculator } from "../src/tools.js";

const model = "gpt-4o";

class CalculatorAgent extends Agent {
    static tools = [Calculator];
    static name = "Calculator Agent";
    static description = "A simple calculator agent";
    static model = "gpt-4o";
}

describe.skip("agents", function () {
    this.timeout(10000);
    this.slow(5000);
    this.afterEach(async function () { await delay(500) });

    it("simple calculator agent", async function () {

        const agent = new CalculatorAgent();
        const answer = await agent.run("what is 2 + 2", (message) => {
            console.log("MESSAGE FROM AGENT", message);
        });
        assert(answer.indexOf("4") !== -1, answer);
    });

    it.only("complex calculator agent", async function () {

        const agent = new CalculatorAgent();
        const answer = await agent.run("what is 2 + 2? and what is 3 * 3?", (message) => {
            console.log("MESSAGE FROM AGENT", message);
        });
        console.log("ANSWER", answer);
        // assert(answer.indexOf("4") !== -1, answer);
    });

    // TODO: multi expression calculator
});

/*
*/