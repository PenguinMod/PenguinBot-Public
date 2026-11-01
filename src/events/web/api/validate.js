const configuration = require("../../../config.js");

const env = require("../../../util/env-util.js");
const PanelAPIEvent = require("../../../classes/panel-api-event.js");

class EndpointEvent extends PanelAPIEvent {
    constructor() {
        super();
        this.listener = "validate";

        this.endpoint = "/validate";
        this.method = "GET";
    }

    /**
     * Runs when the event is invoked
     * @param {import('express').Request} req The Express Request object.
     * @param {import('express').Response} res The Express Response object.
     * @returns {Promise<void>|void}
     */
    async invoke(req, res) {
        res.status(200);
        res.json({ success: true });
    }
}

module.exports = EndpointEvent;
