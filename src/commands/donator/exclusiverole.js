const Database = require('sync-json-database');
const DonatorRoleDB = new Database('./databases/donator-roles.json');

const { Message, MessageEmbed, GuildEmoji } = require('discord.js');
const configuration = require("../../config");
const fetch = require("node-fetch");

class Command {
    constructor() {
        this.name = "exclusiverole";
        this.description = "Manage your custom role for donating or boosting the server.";
        this.attributes = {
            unlisted: false,
            exclusive: true,
            exclusiveInclusive: [
                '1160426569156808734',
            ],
        };
    }

    /**
     * @param {Message} message 
     * @param {Array} args 
     */
    async invoke(message, args, util) {
        let canUseForce = configuration.permissions.exclusiveroleForce.includes(message.author.id);
        if (!args[0]) return message.reply('Please provide a subcommand: `create | get | delete | fix | name | color | icon`');
        
        const subcommand = args.shift();
        switch (subcommand) {
            case 'create': {
                if (DonatorRoleDB.get(String(message.member.id))) {
                    return message.reply("You already have an exclusive role!");
                }
                const dividerRole = await message.guild.roles.fetch('1193298875692367894');
                if (!dividerRole) return message.reply("A role was deleted in the server that is required for exclusive roles.\nPlease wait for a fix.");
                const name = args.join(' ').trim();
                const role = await message.guild.roles.create({
                    name: name || message.member.user.username,
                    position: dividerRole.position + 1
                });
                await message.member.roles.add(role);
                DonatorRoleDB.set(String(message.member.id), String(role.id));
                message.reply(`Created your exclusive role as <@&${role.id}>!`);
                break;
            }
            case 'delete': {
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply("You don't have an exclusive role!");
                }
                const role = await message.guild.roles.fetch(roleID);
                if (role && role.members.size <= 3) { // safe guard incase the role is the member role or something
                    await role.delete(`Deleting exclusive role for ${message.member.user.username}`);
                }
                DonatorRoleDB.delete(String(message.member.id));
                message.reply(`Deleted your exclusive role!`);
                break;
            }
            case 'icon': {
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply("You don't have an exclusive role!");
                }
                const role = await message.guild.roles.fetch(roleID);
                if (!role) {
                    return message.reply("You don't have an exclusive role!");
                }
                if (!(message.attachments && message.attachments.size > 0)) {
                    return message.reply('You need to add an image to your message!');
                }
                const attachment = message.attachments.at(0);
                if (attachment.contentType !== 'image/png' && attachment.contentType !== 'image/jpeg') {
                    return message.reply('Your image must be a PNG or JPEG image!');
                }
                const webResp = await fetch(attachment.url);
                const arrayBuffer = await webResp.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                await role.setIcon(buffer, 'Updating exclusive role icon');
                message.reply("Your role icon has been updated!");
                break;
            }
            case 'name': {
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply("You don't have an exclusive role!");
                }
                const role = await message.guild.roles.fetch(roleID);
                if (!role) {
                    return message.reply("You don't have an exclusive role!");
                }
                const roleName = args.join(' ');
                await role.setName(roleName, 'Updating exclusive role name');
                message.reply("Your role name has been updated!");
                break;
            }
            case 'color': {
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply("You don't have an exclusive role!");
                }
                const role = await message.guild.roles.fetch(roleID);
                if (!role) {
                    return message.reply("You don't have an exclusive role!");
                }
                const hexColor = String(args[0]);
                if (!hexColor.startsWith('#')) return message.reply("Please provide a valid hex color, ex: `#ff0000` for red");
                if (hexColor.length !== 4 && hexColor.length !== 7) return message.reply("Please provide a valid hex color, ex: `#ff0000` for red");
                await role.setColor(hexColor, 'Updating exclusive role color');
                message.reply("Your role color has been updated!");
                break;
            }
            case 'fix': {
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply("You don't have an exclusive role!");
                }
                const role = await message.guild.roles.fetch(roleID);
                if (!role) {
                    return message.reply("You don't have an exclusive role!");
                }
                await message.member.roles.add(role);
                message.reply("Your role has been added to you again!");
                break;
            }
            case 'get': {
                const prefix = util.request("prefix");
                const roleID = DonatorRoleDB.get(String(message.member.id));
                if (!roleID) {
                    return message.reply(`You don't have an exclusive role!\nUse \`${prefix}exclusiverole create\` to make one.`);
                }
                const role = await message.guild.roles.fetch(roleID);
                if (!role) {
                    return message.reply(`You don't have an exclusive role!\nUse \`${prefix}exclusiverole create\` to make one.`);
                }
                const embed = new MessageEmbed();
                embed.setTitle(`${role.name}`);
                embed.setDescription(`Created for <@${message.member.id}>`);
                embed.setThumbnail(role.iconURL());
                embed.addFields([
                    {
                        name: 'Color',
                        value: `${role.hexColor || 'none'}`,
                        inline: true,
                    }
                ]);
                embed.setColor(`${role.hexColor || 'BLURPLE'}`);
                message.reply({
                    embeds: [embed]
                });
                break;
            }
            case 'force': {
                if (!canUseForce) return message.reply('NoPermission');
                if (!args[0]) return message.reply('force (userID) (roleID)');
                DonatorRoleDB.set(args[0], args[1]);
                break;
            }
            case 'getdb': {
                if (!canUseForce) return message.reply('NoPermission');
                if (!args[0]) return message.reply('getdb (userID)');
                const member = await message.guild.members.fetch(args[0]);
                const roleID = DonatorRoleDB.get(args[0]);
                const role = await message.guild.roles.fetch(roleID);
                message.reply({
                    content: `\`${role.name}\` owned by \`${member.user.username}\``,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: false
                    }
                });
                break;
            }
            case 'getpos': {
                if (!canUseForce) return message.reply('NoPermission');
                if (!args[0]) return message.reply('getpos (roleID)');
                const role = await message.guild.roles.fetch(args[0]);
                message.reply({
                    content: `\`${role.position}\``,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: false
                    }
                });
                break;
            }
            case 'setpos': {
                if (!canUseForce) return message.reply('NoPermission');
                if (!args[0]) return message.reply('setpos (roleID) (position)');
                const role = await message.guild.roles.fetch(args[0]);
                await role.setPosition(Number(args[1]));
                message.reply({
                    content: `\`${role.position}\``,
                    allowedMentions: {
                        parse: [],
                        users: [],
                        roles: [],
                        repliedUser: false
                    }
                });
                break;
            }
            default: {
                return message.reply('Please provide a valid subcommand: `create | get | delete | fix | name | color | icon`');
            }
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
