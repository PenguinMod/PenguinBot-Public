const BaseResponse = require("../classes/base-response.js");

class Response extends BaseResponse {
    static rules = [
        // NOTE: "goose bot" is a joke match and isnt actually sensitive
        // NOTE: Blocking israel + tel aviv for avoiding xenophobic political discussion from members (even if admins make mostly harmless jokes at times)
        /\b(condom|hentai|suicide|goosebot|israel)\b/,
        // NOTE: Some "er" or "ing" type words that could be bad
        /\b(goon|groom|jerk|jack|mast(e|u)rbat)(er|ing)\b/,
        /\b(goose\s+bot|tel\s+aviv)\b/,
        // NOTE: To prevent roleplay with inappropriate themes
        /\b(i|don('|)t)\s+consent\b/,
        /\b(jack|jerk)(s|)\s+off\b/,
        // NOTE: To prevent drama discussion of someone saying slurs
        /\b(n|f|r)\s+(word|slur)\b/,
        /\bchild\s+po/,
        /\bkill\s+(my|him|her|them)sel(v|f)/,
        /\bmy\s+(dick|cock|penis|balls)\b/,
    ];

    /**
     * Runs when the response is activated
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke() {
        return {
            content: "Hey, this topic doesn't seem like it should be discussed in this server."
                + "\n" + "Please remember that this is a public space and try to respect our rules. 🙂"
        };
    }
}

module.exports = Response;
