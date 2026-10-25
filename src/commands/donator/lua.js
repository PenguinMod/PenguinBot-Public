const nodeUtil = require('node:util');

const Lua = require("../../util/lua.js");
const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = 'lua';
        this.description = 'Run sandboxed Lua code in Discord.';
        this.attributes = {
            unlisted: false,
            exclusive: true,
            permission: 0,
        };

        this.runners = new Set();
    }

    async invoke(message, args, util) {
        const isAdmin = util.getPermissionLevel(message) >= 3;

        // see if this non-admin is already running code
        if (this.runners.has(message.author.id) && !isAdmin)
            return message.reply("You are already running a Lua script. Please wait for that one to finish.");
        this.runners.add(message.author.id);

        try {
            let luaCode = args.join(" ");
            const luaAttachment = message.attachments.first();
            if (luaAttachment) {
                if ((luaAttachment.size > (1 * 1024 * 1024)) && !isAdmin)
                    return message.reply("That script is too large. Files must be under 1 megabyte.");
                const attachmentFetch = await fetch(luaAttachment.url);
                const attachmentString = await attachmentFetch.text();
                luaCode = attachmentString;
            }
            if ((Buffer.byteLength(luaCode, 'utf8') > (1 * 1024 * 1024)) && !isAdmin)
                return message.reply(`That script is too large. Scripts must be under 1 megabyte.`);

            const result = await Lua.evaluate(luaCode);
            const display = typeof result === "object" && result ? `ansi\n${nodeUtil.inspect(result, { showHidden: true, colors: true }).slice(0, 1989)}` : result;
            message.reply({
                content: `\`\`\`${display}\`\`\``.substring(0, 2000),
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            message.reply({
                content: `❌ - Error running Lua code\n\`\`\`${err.stack ? err.stack : err}\`\`\``.substring(0, 2000),
                allowedMentions: { // ping NO ONE. this can DEFINETLY be abused if we did allow pings
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } finally {
            this.runners.delete(message.author.id);
        }
    }
}

module.exports = Command;
