const BaseCommand = require("./basecommand.js");

class QuickReplyCommand extends BaseCommand {
    constructor() {
        super();
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        /**
         * The message to reply with upon usage.
         * @type {string}
         */
        this.message = 'Quick reply text.';
    }

    invoke(message) {
        message.reply({
            content: String(this.message).substring(0, 2000),
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            }
        });
    }
}

module.exports = QuickReplyCommand;
