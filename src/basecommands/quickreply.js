class QuickReplyCommand {
    constructor() {
        this.message = 'Quick reply text.';
        this.attributes = {
            unlisted: false,
            permission: 0,
        };
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
