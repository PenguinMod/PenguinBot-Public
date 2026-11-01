class BaseResponse {
    /**
     * RegExp rules that should result in this response being used.
     * @type {RegExp[]}
     */
    static rules = [];

    /**
     * Runs on creation
     * @returns {Promise<void>|void}
     */
    static initialize() {
        return;
    }
    /**
     * Runs when the response is activated
     * @param {string} content 
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke(content) {
        // should be overridden
        return {
            content: "Default text"
        };
    }
}

module.exports = BaseResponse;
