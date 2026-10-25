const BotState = require("./bot-state.js");

/**
 * Replaces `{{REPLACER}}` tokens in text with state values
 * @param {string} str text to fill in
 * @returns {string} text with the state vars
 */
const stateFill = (str) => {
    return str.replace(/{{[^}]+}}/g, (text) => BotState.request(text.replace(/[{}]/g, "")));
};

module.exports = stateFill;
