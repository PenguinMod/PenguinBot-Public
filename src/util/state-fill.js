const CommandUtility = require("./utility");

/**
 * Replaces `{{REPLACER}}` tokens in text with state values
 * @param {string} str text to fill in
 * @returns {string} text with the state vars
 */
const stateFill = (str) => {
    return str.replace(/{{[^}]+}}/g, (text) => CommandUtility.request(text.replace(/[{}]/g, "")));
};

module.exports = stateFill;
