const BotState = require("../util/bot-state.js");
const PenguinModClient = require("../util/penguinmod-client.js");

const BaseResponse = require("../classes/base-response.js");

// TODO: put this ID in configuration
const statusChannelId = "1040401867924062259";
// TODO: Congfigure intervalTime env
const intervalTime = 30 * 60 * 1000; // 30 minutes
const responses = {
    unknown: "Our servers could be down right now.",
    up: "Our servers should be online right now. It's possible something else may be wrong.",
    slow: "Our server seems to be unstable or slow at the moment.",
};

class Response extends BaseResponse {
    static rules = [
        /\b(can('|)t|cannot)\s+(i\s+)?(sign\s+in|signin|log\s+in|login|upload)\b/,
        /\b(unable|not\s+able)\s+(to\s+)?(sign\s+in|signin|log\s+in|login|upload)\b/,

        /\bserver\s+is\s+(still\s+)?down\b/,
        /\bwhy\s+is\s+it\s+still\s+down\b/,
        /\bwhy\s+is\s+the\s+server\s+(still\s+)?down\b/,
        /\bwhy\s+are\s+the\s+servers?\s+(still\s+)?down\b/,
        /\bwhy\s+(server|the\s+server|is\s+server)\s+down\b/,

        /\bno\s+(sign\s+in|signin|login|upload)\b/,
    ];

    /**
     * The current status message.
     */
    static currentResponse = responses.unknown;
    /**
     * The current setInterval for getting the response
     * @type {NodeJS.Timeout?}
     */
    static currentInterval = null;
    /**
     * Fetch and update the current status message based on how the API responds.
     */
    static async updateCurrentResponse() {
        if (BotState.shuttingDown) {
            console.log("cantlogin: Shutting down bot so lying about currentResponse");
            return this.currentResponse;
        }

        const startTime = Date.now();
        try {
            const successful = await PenguinModClient.checkOnline();
            const amountOfTime = Date.now() - startTime;
            this.currentResponse = responses.unknown;
            if (successful && amountOfTime <= 2500) {
                this.currentResponse = responses.up;
            } else if (successful) {
                this.currentResponse = responses.slow;
            }
        } catch {
            this.currentResponse = responses.unknown;
        }

        console.log("cantlogin: pinged PenguinModClient.checkOnline() for cantlogin response;", this.currentResponse);
        return this.currentResponse;
    };
    static initialize() {
        // TODO: make it so you can Configure env to see if we should even do fetches
        this.currentInterval = setInterval(async () => {
            if (BotState.shuttingDown) {
                console.log("cantlogin: Shutting down bot so clearing");
                return clearInterval(this.currentInterval);
            }

            await this.updateCurrentResponse();
        }, intervalTime);
        this.updateCurrentResponse();
    }

    /**
     * Runs when the response is activated
     * @returns {import("discord.js").MessageOptions}
     */
    static invoke() {
        return {
            content: `Can't sign in or upload projects? ${this.currentResponse}`
                + "\n" + `Make sure to check <#${statusChannelId}> for PenguinMod server status updates.`,
        };
    }
}

module.exports = Response;
