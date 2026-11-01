const BaseResponse = require("../classes/base-response.js");

class Response extends BaseResponse {
    static rules = [
        /\badd\s+(?:a?\s+)?sex(\s+extension|)\s+(to|for|with|in)\s+(penguinmod|pm)\b/,
        /\bmake\s+(?:a?\s+)?sex(\s+extension|)\s+(to|for|with|in)\s+(penguinmod|pm)\b/,
        /\badd\s+(?:a?\s+)?sex\s+extension\b/,
        /\bmake\s+(?:a?\s+)?sex\s+extension\b/,
        /\bsex\s+(in|to)\s+(penguinmod|pm)\b/,
        /\b(penguinmod|pm)\s+sex\s+update\b/,
    ];

    /**
     * Runs when the response is activated
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke() {
        return {
            files: ["./assets/randomImages/never.png"],
        };
    }
}

module.exports = Response;
