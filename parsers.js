// YOLO CODE: https://themaximalist.com/infinityarcade/
function parseJSONFromText(blob) {
    try {
        return JSON.parse(blob);
    } catch (e) {
        // noop
    }

    const lines = blob.split("\n");
    for (const line of lines) {
        if (line[0] == "{") {
            try {
                return JSON.parse(line);
            } catch (e) {
                // noop
            }
        }
    }

    throw new Error(`Invalid response: '${blob}'`);
}


module.exports = {
    parseJSONFromText,
};