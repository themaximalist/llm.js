export class Tool {
    static get name() {
        return this.constructor.name.toLowerCase();
    }

    static get schema() {
        const parameters = {
            type: "object",
            properties: this.parameters,
            required: Object.keys(this.parameters),
        };

        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters,
            }
        };
    }
}

export class Calculator extends Tool {
    static description = "A simple calculator";
    static parameters = {
        expression: { type: "string" }
    };

    static run({ expression }) {
        return eval(expression);
    }
}