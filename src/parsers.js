export function codeBlock(blockType) {
    return function (content) {
        try {
            return content.split("```" + blockType)[1].split("```")[0].trim();
        } catch (e) {
            console.log(`error parsing code block of type ${blockType} from content`, content);
            throw e;
        }
    }
}

export function json(content) {
    try {
        return JSON.parse(content);
    } catch (e) {
        const parser = codeBlock("json");
        return JSON.parse(parser(content));
    }
}

export function xml(tag) {
    return function (content) {
        try {
            const inner = content.split(`<${tag}>`)[1].split(`</${tag}>`)[0].trim();
            if (!inner || inner.length == 0) {
                throw new Error(`No content found inside of XML tag ${tag}`);
            }
            return inner;
        } catch (e) {
            console.log(`error parsing xml tag ${tag} from content`, content);
            throw e;
        }
    }
}