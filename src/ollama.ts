import LLM from "./LLM";

export default class Ollama extends LLM {
    readonly service: string = "ollama";
}
