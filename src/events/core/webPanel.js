const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");
const BotEventEmitter = require('../../util/bot-event-emitter.js');

const BaseBotEvent = require('../../classes/base-bot-event.js');

const WebPanel = require("../../panel/server.js");

class BotEvent extends BaseBotEvent {
    constructor() {
        super();
        this.listener = "ready";
        this.once = true;

        this.handler = BotEventEmitter;
    }

    /**
     * Runs when the event is invoked
     * @returns {Promise<any>}
     */
    async invoke() {
        if (!env.getBool("WEB_PANEL_ENABLED"))
            return;
        
        WebPanel.initialize();
    }
}

module.exports = BotEvent;