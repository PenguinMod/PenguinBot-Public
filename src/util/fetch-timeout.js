/**
 * specify `timeout` in options as milliseconds
 * @param {string|URL|globalThis.Request} url 
 * @param {RequestInit & {timeout?: number}} options
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}) => {
    // you specify timeout in options
    const { timeout = 0 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(id);
    }
};

module.exports = fetchWithTimeout;