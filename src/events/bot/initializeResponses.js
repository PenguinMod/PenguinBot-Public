const configuration = require("../../config.js");

const env = require("../../util/env-util.js");
const ResponseHandler = require('../../util/response-handler.js');
const BotEventEmitter = require("../../util/bot-event-emitter.js");

const BaseBotEvent = require("../../classes/base-bot-event.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "afterSetup";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool('RESPOND_TO_KEYWORDS'))
            return;

        console.log("Setting up keyword auto-responses");
        await ResponseHandler.initialize();
    }
}

module.exports = BotEvent;
