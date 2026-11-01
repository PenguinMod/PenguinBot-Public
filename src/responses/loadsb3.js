const BaseResponse = require("../classes/base-response.js");

class Response extends BaseResponse {
    static rules = [
        /\bload\s+(?:an?\s+)?\.?sb3\b/,
        /\bimport\s+(?:an?\s+)?\.?sb3\b/,
    ];

    /**
     * Runs when the response is activated
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke() {
        return {
            content: "Want to load your TurboWarp or Scratch project into PenguinMod?"
                + "\n" + "Try this tutorial! https://discord.com/channels/1033551490331197462/1181430242963902565",
        };
    }
}

module.exports = Response;
