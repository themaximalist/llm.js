import { describe, it, expect } from "vitest";
import { join } from "../src/utils";

describe("utils", function () {
    describe("join", function () {
        it("paths", function () {
            expect(join("a", "b", "c")).toBe("a/b/c");
            expect(join("a", "b", "c", "d")).toBe("a/b/c/d");
            expect(join("a/", "b/", "c/")).toBe("a/b/c");
            expect(join("a/", "/b/", "/c/")).toBe("a/b/c");
        });

        it("absolute paths", function () {
            expect(join("/a", "/b", "/c")).toBe("/a/b/c");
            expect(join("/home/user", "documents", "file.txt")).toBe("/home/user/documents/file.txt");
        });

        it("relative paths", function () {
            expect(join("a", "../b", "c")).toBe("b/c");
            expect(join("./a", "./b", "c", "./d")).toBe("a/b/c/d");
        });

        it('urls', function () {
            expect(join("https://example.com", "a", "b", "c")).toBe("https://example.com/a/b/c");
            expect(join("https://example.com", "a", "b", "c", "d")).toBe("https://example.com/a/b/c/d");
            expect(join("https://example.com", "a/", "b/", "c/")).toBe("https://example.com/a/b/c/");
            expect(join("https://example.com", "a/", "/b/", "/c/")).toBe("https://example.com/a/b/c/");
        });
    });

});