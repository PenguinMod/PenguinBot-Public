const env = require("./env-util");

/**
 * Replaces `{{REPLACER}}` tokens in text with .env values
 * 
 * ***USE THIS VERY CAREFULLY!*** Intended for harmless values such as prefix.
 * @param {string} str text to fill in
 * @returns {string} text with the env vars
 */
const envFill = (str) => {
    return str.replace(/{{[^}]+}}/g, (text) => env.get(text.replace(/[{}]/g, "")));
};

module.exports = envFill;
