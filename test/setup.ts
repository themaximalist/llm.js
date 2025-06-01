import { beforeEach } from "vitest";
import Anthropic from "../src/anthropic.js";

beforeEach(() => {
    Anthropic.DEFAULT_MODEL = "claude-3-5-haiku-latest";
});
  