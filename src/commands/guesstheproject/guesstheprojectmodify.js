const discord = require("discord.js");

const configuration = require("../../config.js");

const OptionType = require('../../util/optiontype.js');
const GuessTheProject = require("../../util/guess-the-project.js");
const PenguinModClient = require("../../util/penguinmod-client.js");

const BaseCommand = require("../../classes/basecommand.js");

class Command extends BaseCommand {
    constructor() {
        super();
        this.name = "guesstheprojectmodify";
        this.description = `Modify the results for Guess the Project.`;
        this.descriptionLong = `Modify the results for Guess the Project.`
            + "\n" + "-" + " " + "Specify `start` to enable `/guesstheproject`. Participants earn 50 <:favorite:1158864719764017212> Event XP."
            + "\n" + "-" + " " + "Specify `reveal` to disable `/guesstheproject`, and reward 100 <:favorite:1158864719764017212> Event XP to participants who guessed correctly."
            + "\n" + "-" + " " + "Specify `wipe` to disable `/guesstheproject`, and delete all guesses internally. Participants will keep their XP, but no reveal XP is given."
            + "\n" + "When using `reveal`, you must specify a project ID or URL to mark as the correct answer. The same inputs as `/guesstheproject` are allowed."
            + "\n" + "You can use the `reveal` command to ping winners, or copy the pings if performed in another channel.";
        this.attributes = {
            unlisted: true,
            eventManagers: true,
        };

        this.example = [
            { text: "{{prefix}}guesstheprojectmodify start" },
            { text: "{{prefix}}guesstheprojectmodify reveal 6412092678" },
            { text: "{{prefix}}guesstheprojectmodify wipe" },
        ];
    }

    async invoke(message, args, util) {
        const action = args.shift();
        if (!["start", "reveal", "wipe"].includes(action))
            return this.reject(message, "Specify either `start`, `reveal`, or `wipe`.");
        switch (action) {
            case "start":
                if (GuessTheProject.canGuess())
                    return this.reject(message, "A round is already in progress.");
                GuessTheProject.clearGuesses();
                GuessTheProject.setEnabled(true);
                return message.reply("Enabled guessing for this round.");
            case "wipe":
                GuessTheProject.setEnabled(false);
                GuessTheProject.clearGuesses();
                return message.reply("Deleted all guesses for this round. Guessing has been disabled.");
            case "reveal":
                const projectInput = args.shift();
                const projectId = GuessTheProject.resolveTextId(projectInput);
                if (!projectId)
                    return this.reject(message, "Specify a valid project ID/URL to reveal as the answer.");

                // format a nice message
                const correctUsers = await GuessTheProject.revealAnswer(projectId);
                const correctUserList = correctUsers.map(user => `<@${user.id}>`).join(",")
                    || "No one";
                const congratsText = `Congratulations to: ${correctUserList}. You've won 100 <:favorite:1158864719764017212> Event XP.`;
                const projectUrl = `https://projects.penguinmod.com/${projectId}`;

                // try to display the project nicely
                let firstLine = `The answer was [this project](${projectUrl}).`;
                try {
                    const projectInfo = await PenguinModClient.projects.getProjectMeta(projectId);
                    firstLine = `The answer was [**${projectInfo.title}**](${projectUrl}).`;
                } catch {
                    // NOTE: uhh.. do nothing here i guess, we cant reject because weve already granted rewards and closed everything
                }
                return message.reply({
                    content: `${firstLine}\n${congratsText}`.substring(0, 2000),
                    flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
                    allowedMentions: {
                        parse: [],
                        users: correctUsers.map(user => user.id),
                        roles: [],
                        repliedUser: false
                    }
                });
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;