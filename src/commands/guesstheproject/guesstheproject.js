const discord = require("discord.js");

const configuration = require("../../config.js");

const OptionType = require('../../util/optiontype.js');
const GuessTheProject = require("../../util/guess-the-project.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "guesstheproject";
        this.description = `Slash command only. Submit a guess for the current #guess-the-project.`;
        this.slashDescription = `Submit a guess for the current #guess-the-project. You can only make one guess.`;
        this.descriptionLong = `Submit a guess for the current <#${configuration.channels.guessTheProjectMembers}>.`
            + "\n" + `In the <#${configuration.channels.guessTheProjectMembers}> channel, you will be given a cropped screenshot of a random project.`
            + "\n" + `You can post the URL or ID of the project in this command, and correct guesses will only be rewarded after it is revealed.`
            + "\n" + "You can only make one guess, and all event managers & staff will see your guess on submission."
            + "\n" + "-" + " " + "Participation earns you 50 <:favorite:1158864719764017212> Event XP."
            + "\n" + "-" + " " + "Correct guesses earn you 100 extra <:favorite:1158864719764017212> Event XP once the project is revealed."
            + "\n" + "This command can only be used as a slash command.";
        this.attributes = {
            unlisted: false,
            permission: 0,
        };

        this.slash = {
            options: [{
                type: OptionType.STRING,
                name: 'project',
                required: true,
                description: 'What\'s the URL/ID of the project?'
            }]
        };

        this.example = [
            { text: "/guesstheproject 6412092678" },
            { text: "/guesstheproject https://projects.penguinmod.com/4624594217" },
        ];
    }

    convertSlashCommand(interaction, util) {
        return [interaction, [], util, true];
    }

    // TODO: This sucks really bad and util should have util.isSlash or something
    async invoke(message, _, util, isSlash) {
        isSlash = isSlash === true;
        if (!isSlash) {
            if (message.channel.id !== configuration.channels.guessTheProjectMembers) {
                await message.reply({
                    content: 'Please use this command as a slash command.',
                    ephemeral: true,
                });
            }
            message.delete().catch(() => {});
            return;
        }

        // see if theyve suybmitted
        const user = message.member.user;
        if (!GuessTheProject.canGuess())
            return message.reply({
                content: "You can't guess right now. The last project has already been revealed.",
                ephemeral: true,    
            });
        if (GuessTheProject.hasGuessed(user) || GuessTheProject.isOccupied(user))
            return message.reply({
                content: "You can't guess right now. You've already made a guess for this project.",
                ephemeral: true,
            });

        // make guess
        const projectInput = message.options.getString('project');
        const projectId = GuessTheProject.resolveTextId(projectInput);
        if (!projectId)
            return message.reply({
                content: "You need to submit a valid PenguinMod project ID or URL as a guess.",
                ephemeral: true,
            });
        await GuessTheProject.makeGuess(user, projectId);

        // success
        return await message.reply({
            content: 'Your guess has been submitted, and you have earned 50 <:favorite:1158864719764017212> Event XP.',
            ephemeral: true,
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;