class LLM {
    constructor(private input?: string) {}

    async send(): Promise<string> {
        return "blue";
    }

    static async create(input: string, options = {}): Promise<string> {
        const llm = new LLM(input);
        return await llm.send();
    }
}

class Anthropic extends LLM {
}

// Function overloads for different call signatures
interface LLMConstructor {
    new (input: string): LLM;
    (input: string): Promise<string>;
}

const LLMShortHand = function(input: string): Promise<string> | LLM {
    // @ts-ignore - TypeScript can't fully understand this pattern, but it works at runtime
    if (new.target) {
        // Called with 'new'
        return new LLM(input);
    } else {
        // Called as function
        return LLM.create(input);
    }
} as LLMConstructor;

export default LLMShortHand;
