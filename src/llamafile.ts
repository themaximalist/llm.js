import type { Options, ServiceName, Model } from "./LLM.types";
import APIv1 from "./APIv1";

/**
 * @category Options
 */
export type LLamafileOptions = Options & {
    n_predict?: number;
}

/** Llamafile should be run in --v2 mode for better compatibility.
 * 
 *  Note: Tools and Thinking are not well supported. For better local support see {@link Ollama}.
 * 
 * @category LLMs
 */
export default class LLamafile extends APIv1 {
    static readonly service: ServiceName = "llamafile";
    static DEFAULT_BASE_URL: string = "http://localhost:8080/v1/";
    static DEFAULT_MODEL: string = "llamafile";
    static isLocal: boolean = true;

    parseOptions(options: LLamafileOptions): LLamafileOptions {
        options = super.parseOptions(options) as Options;
        if (options.max_tokens) {
            const max_tokens = options.max_tokens;
            delete options.max_tokens;
            options.n_predict = max_tokens;
        }

        delete options.tools;

        return options;
    }

    async fetchModels(): Promise<Model[]> {
        return [{ model: "llamafile", mode: "chat", service: "llamafile", created: new Date() } as Model];
    }
}
