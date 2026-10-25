const discord = require("discord.js");

const Database = require('sync-json-database');
const GuessTheProjectSubmissions = new Database('./databases/guess-the-project-submissions.json');

const configuration = require("../config.js");

const EventXP = require("./event-xp.js");
const BotState = require("./bot-state.js");
const PenguinModClient = require("./penguinmod-client.js");

class GuessTheProject {
    static _guessing = new Set();
    static _projectTitles = new Map();

    /**
     * Resolves project ID from an input URL or ID
     * @param {string} input either text ID, or URL from projects/studio (with or without protocol)
     * @returns {string} the project ID. "" should be handled when the input has no text ID to grab
     */
    static resolveTextId(input = "") {
        // DISCLOSURE: this is ay ei
        if (!input) return "";
        if (!input.includes("/")) return input;

        // add the http if its missing, and ignore anty trailing / at the end (unless we have hash, then just use that directly)
        const url = new URL(input.startsWith("http") ? input : `https://${input}`);
        if (url.hostname === "projects.penguinmod.com" || url.hostname === "studio.penguinmod.com")
            return url.hash.slice(1) || url.pathname.split("/").filter(Boolean).pop() || input;
        return input;
    }

    /**
     * Tell if guessing is enabled
     */
    static canGuess() {
        return GuessTheProjectSubmissions.get("enabled") === true;
    }
    /**
     * Tell if a user has already guessed
     * @param {import("discord.js").User} user 
     */
    static hasGuessed(user) {
        const guesses = GuessTheProjectSubmissions.get("guesses") || {};
        return (user.id in guesses);
    }
    /**
     * Tell if a user is in the middle of guessing
     * @param {import("discord.js").User} user 
     */
    static isOccupied(user) {
        return this._guessing.has(user.id);
    }

    /**
     * Set the state of guessing
     * @param {boolean} enabled
     */
    static setEnabled(enabled) {
        GuessTheProjectSubmissions.set("enabled", enabled);
    }
    /**
     * Occupies a user for guessing during a callback (ie, they cant make a guess while the code is processing another guess they made)
     * @param {import("discord.js").User} user 
     * @param {() => void|Promise<void>} callback callback
     */
    static async occupy(user, callback) {
        if (this.isOccupied(user))
            throw new Error("User is occupied");
        this._guessing.add(user.id);
        try {
            await callback();
        } finally {
            this._guessing.delete(user.id);
        }
    }
    /**
     * Have a user make a guess and give them rewards for participating
     * @param {import("discord.js").User} user 
     * @param {string} projectId 
     */
    static async makeGuess(user, projectId) {
        await this.occupy(user, async () => {
            if (!this.canGuess())
                throw new Error("Guessing is disabled");
            if (this.hasGuessed(user))
                throw new Error("User has already guessed");

            // try to make the submission look nicer
            let projectDisplay = `**${projectId}**`;
            try {
                const projectObjWithTitle = this._projectTitles.has(projectId) ? { title: this._projectTitles.get(projectId) }
                    : await PenguinModClient.projects.getProjectMeta(projectId);
                projectDisplay = `**${projectId}** *(${projectObjWithTitle.title || "not real?"})*`;
            } catch {
                projectDisplay = `**${projectId}** *(not real?)*`;
            }
            
            // post the submission
            let submissionText = `<@${user.id}> (${user.id}) thinks: ${projectDisplay}; https://projects.penguinmod.com/${projectId}`;
            const projectSubmissionChannel = BotState.client.channels.cache.get(configuration.channels.guessTheProjectManager);
            await projectSubmissionChannel.send({
                content: submissionText,
                flags: discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS,
                allowedMentions: {
                    parse: [],
                    users: [],
                    roles: [],
                    repliedUser: false
                }
            });

            GuessTheProjectSubmissions.update("guesses", (guesses) => {
                guesses[user.id] = projectId;
                return guesses;
            });

            EventXP.registerLocal(user.id, { username: user.username });
            EventXP.updateLocal(user.id, (oldXp) => oldXp + 50);
            await EventXP.commit();
        });
    }

    /**
     * Clears the list of guesses. Note that participants will already have rewards for guessing, this is purely just for cleanup.
     * This cannot be used when guessing is enabled.
     */
    static clearGuesses() {
        if (this.canGuess())
            throw new Error("Guessing is enabled");
        GuessTheProjectSubmissions.set("guesses", {});
    }
    /**
     * Disables and clears guesses, then rewards XP to users who got the correct answer.
     * @param {string} projectId 
     */
    static async revealAnswer(projectId) {
        // NOTE: structuredClone incase clearGuesses makes the in-memory object lose our guesses
        const guesses = structuredClone(GuessTheProjectSubmissions.get("guesses") || {});
        this.setEnabled(false);
        this.clearGuesses();

        const correctUsers = [];
        for (const userId in guesses) {
            const guessedProjectId = guesses[userId];
            if (guessedProjectId !== projectId) continue;

            try {
                const user = BotState.client.users.cache.get(userId)
                    || (await BotState.client.users.fetch(userId));
                EventXP.registerLocal(userId, { username: user.username });
                EventXP.updateLocal(userId, (oldXp) => oldXp + 100);
                correctUsers.push(user);
            } catch (err) {
                console.warn("Failed to reward user", userId, "with XP (maybe they left the server?);", err);
            }
        }

        await EventXP.commit();
        return correctUsers;
    }
}

module.exports = GuessTheProject;
