const svgRender = require("../util/svg-render");
const svgRepair = require("../util/svg-repair");

class Command {
    constructor() {
        this.name = "svg";
        this.description = "Renders an SVG costume/drawing as a PNG.";
        this.attributes = {
            permission: 0,
            numberConversion: true,
        };
    }

    async invoke(message, args, util) {
        const renderDpi = Math.min(Math.max(1, (Number(args.shift() || 1) * 72)), 72 * 3);

        // get user input
        const attachment = message.attachments.first();
        if (!attachment) return message.reply("Attach an SVG file. (Scratch costume/Vector file)");
        if (attachment.size > 5 * 1024 * 1024) return message.reply("That image is too large to render.");

        // we just expect this to work because realistically the command shouldnt work if this doesnt
        const attachmentFetch = await fetch(attachment.url);
        const attachmentString = await attachmentFetch.text();
        if (!attachmentString.slice(0, 128).includes("<")) return message.reply("That doesn't look like an SVG.");

        // attempt rendering
        try {
            const repaired = svgRepair(attachmentString);
            const image = await svgRender(repaired, renderDpi);
            message.reply({
                content: `Displayed by <@${message.author.id}>`,
                files: [image],
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        } catch (err) {
            message.reply({
                content: `Failed to render, even after repairing your SVG: ${err}`.substring(0, 2000),
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: true
                }
            });
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;