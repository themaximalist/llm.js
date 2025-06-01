import { describe, it, expect } from "vitest";
import * as parsers from "../src/parsers";

describe("parsers", function () {
    it("json", function () {
        expect(parsers.json('{"a": 1}')).toEqual({ a: 1 });
        expect(parsers.json("\`\`\`json\n{\n  \"a\": 1\n}\n\`\`\`")).toEqual({ a: 1 });
    });

    it("markdown", function () {
        expect(parsers.codeBlock("markdown")("```markdown\n# Hello\n```")).toEqual("# Hello");
    });

    it("xml", function () {
        expect(parsers.xml("a")("<a>1</a>")).toEqual("1");
        expect(parsers.xml("thinking")("<thinking>1, 2, 3</thinking>")).toEqual("1, 2, 3");
    });
});