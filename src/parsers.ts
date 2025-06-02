import logger from "./logger";

const log = logger("LLM:parsers");

export function codeBlock(blockType: string) {
    return function (content: string) : string {
        try {
            return content.split("```" + blockType)[1].split("```")[0].trim();
        } catch (e) {
            log.error(`error parsing code block of type ${blockType} from content`, content);
            throw e;
        }
    }
}

export function markdown(content: string) : string {
    try {
        return codeBlock("markdown")(content);
    } catch (e) {
        return codeBlock("md")(content);
    }
}

export function json(content: string) : any {
    try {
        return JSON.parse(content);
    } catch (e) {
        const parser = codeBlock("json");
        return JSON.parse(parser(content));
    }
}

export function xml(tag: string) {
    return function (content: string) : string {
        try {
            const inner = content.split(`<${tag}>`)[1].split(`</${tag}>`)[0].trim();
            if (!inner || inner.length == 0) {
                throw new Error(`No content found inside of XML tag ${tag}`);
            }
            return inner;
        } catch (e) {
            log.error(`error parsing xml tag ${tag} from content`, content);
            throw e;
        }
    }
}