/**
 * @fileoverview Wrapper for fetching the API with the token in the headers
 */
(function () {
    'use strict';

    const apiOrigin = location.origin;

    /**
     * Fetches `location.origin` with the localStorage `pmbot:token` if set
     * @param {string} endpoint ex, /api/validate, /api/restart
     * @param {RequestInit} options 
     * @returns {Promise<Response>}
     */
    const fetchApi = async (endpoint, options = {}) => {
        const token = localStorage.getItem("pmbot:token");
        if (!token)
            throw new Error("No API token set");

        const headers = { ...options.headers };
        headers["Authorization"] = `Bearer ${token}`;
        const response = await fetch(`${apiOrigin}${endpoint}`, {
            ...options,
            headers
        });

        // NOTE: Throw error as text if this isnt valid JSON
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            if (!response.ok)
                throw json.error || json;
            return json;
        } catch (err) {
            // a text error is masked by JSON failing
            if (err instanceof SyntaxError) {
                console.error(err);
                throw text;
            }

            // otherwise throw the actual error
            throw err;
        }
    };

    window.fetchApi = fetchApi;
})();