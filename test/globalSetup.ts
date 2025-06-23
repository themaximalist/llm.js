import type { TestProject } from 'vitest/node'
import { readFileSync } from "fs";

export default function setup(project: TestProject) {
    const taco = readFileSync("./test/taco.jpg", "base64");
    const dummy = readFileSync("./test/dummy.pdf", "base64");
    project.provide("taco", taco);
    project.provide("dummy", dummy);
}

declare module "vitest" {
    export interface ProvidedContext {
        taco: string;
        dummy: string;
    }
  }