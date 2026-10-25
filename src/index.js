const fs = require("fs/promises");
const path = require("path");

const discord = require("discord.js");

const EventHandler = require('./handleEvents.js');

const delay = require("./util/delay.js");
const env = require("./util/env-util.js");
const BotState = require("./util/bot-state.js");
const FormatTime = require("./util/format-time.js");
const HostUtility = require("./util/utility-host.js");
const DiscordUtility = require("./util/utility-discord.js");

/**
 * Life-cycle:
 * - Keep start time in memory before anything else
 * - The bot will keep track of runtime in a database called LastState
 *   - If the bot ran in the past, then there will be an existing LastState that we have to save in memory
 *   - Keep our previous life's runtime in memory before we override it with our own
 * - Leave a light-switch on in LastState (status === "active"/markInUse()) that marks that we aren't expecting to shutdown yet
 *   - If the bot starts again in the future without this switch flipped to something else ("restart","abort", etc) then it crashed randomly/host rebooted randomly
 * - Setup root folders in the bot
 * - Cleanup the temp folder for leftovers on random restarts
 * - Setup, define the bot state and dump the information into BotState for commands to use
 * - Conect to discord
 *   - If this fails, its considered a truly critical error we cant recover from, so we actually abort running entirely
 * - Listen for events & run the rest of the bot
 * - .... (users can use the bot, etc)
 * - pm!restart switches the light switch (status === "restart") so when we shutdown, our next life will see that we restarted properly
 */
// The Actual core logic is heeere:
// TODO: We should use ESM so this icky thing isnt needed (that's a tall order though)
(async () => {
    // startMilliseconds will point to the actual index.js start time
    HostUtility.startMilliseconds = Date.now();

    // NOTE: Intentionally calling private method; we save the last bot runtime's state into HostUtility before we mess with it
    const lastState = await HostUtility._getLastState();
    HostUtility.lastState = lastState;

    // set the state as active
    await HostUtility.markInUse();

    // do some logging
    const isInTestMode = HostUtility.launchMode === 'test';
    console.log('Launched as', HostUtility.launchMode);

    console.log("We started booting at", HostUtility.startMilliseconds);
    console.log("Boot date:", new Date(HostUtility.startMilliseconds));
    console.log("Our last state was;", HostUtility.lastState);
    console.log("Our last status;", HostUtility.lastState.status, HostUtility.lastState.error);
    if (HostUtility.lastState.created && HostUtility.lastState.status === "active") {
        if (!isInTestMode) {
            console.warn("Potentially experienced an unexpected reboot, will log in Discord also");
        } else {
            console.log("Last state was active but not warning due to running in test mode");
        }
    }

    // Create core folders
    // NOTE: databases is usually created by sync-json-database but we'll try again here for completeness
    const coreFolderDatabases = path.join(__dirname, `../databases/`);
    const coreFolderCache = path.join(__dirname, `../cache/`);
    const coreFolderData = path.join(__dirname, `../data/`);
    const coreFolderTemp = path.join(__dirname, `../temp/`);
    await fs.mkdir(coreFolderDatabases, { recursive: true });
    await fs.mkdir(coreFolderCache, { recursive: true });
    await fs.mkdir(coreFolderData, { recursive: true });
    await fs.mkdir(coreFolderTemp, { recursive: true });

    // if we arent in test mode & the env is set, clear the temp folder
    const clearFolderTemp = env.getBool("CLEANUP_FOLDER_TEMP");
    if (clearFolderTemp && isInTestMode) {
        console.log("Not clearing the temp folder despite CLEANUP_FOLDER_TEMP due to running in test mode");
    } else if (clearFolderTemp && !isInTestMode) {
        console.log("Clearing temp folder; CLEANUP_FOLDER_TEMP is set");
        try {
            // NOTE: The temp folder can contain subfolders and files of random content, so we need to remove dirs & files
            const folderItems = await fs.readdir(coreFolderTemp);
            for (const folderItem of folderItems) {
                const realPath = path.join(coreFolderTemp, folderItem);
                console.log("Deleting temp path:", realPath);

                // NOTE: Scary!
                await fs.rm(realPath, { force: true, recursive: true });
            }
        } catch (err) {
            console.warn("Failed to clean temp folder;", err);
        }
    }

    // create client with stuff
    if (BotState.shuttingDown)
        return console.log("Shutting down so not processing client any further");
    const client = new discord.Client({
        intents: [
            Object.values(discord.Intents.FLAGS).reduce((acc, p) => acc | p, 0)
        ],
        partials: [
            "REACTION",
            "CHANNEL"
        ]
    });

    // stop it from fuckin crashing after som stupid discord error
    // NOTE: Intentionally catching fatal errors without crashing because we usually dont want to
    process.on('uncaughtException', (err) => {
        console.log('\n');
        console.log('---------------------');
        console.log('Error!');
        console.log(err);
        console.log('---------------------');
        console.log('\n');
    });

    // add state stuff
    const prefix = isInTestMode ? env.get("PREFIX_TEST") : env.get("PREFIX");
    const state = {
        commands: {},
        slash: {},
        alias: {},
        services: {}, // commands can add to this object themselves
        serialized: lastState.serialized || {}, // persists across reboots
        prefix,
        isInTestMode,
        panelForcedDisabled: env.getBool("STATE_DEFAULT_PANELFORCEDDISABLED"),
        preventRuntimeChanges: env.getBool('PREVENT_UPDATES')
    };

    // setup BotState to have all the props we need
    BotState.state = state;
    BotState.client = client;
    BotState.active = true;

    // check online connectivity before attempting to connect to discord's api
    if (env.getBool("CONNECTIVITY_CHECK_FOR_OFFLINE")) {
        const max = env.getNumber("CONNECTIVITY_CHECK_MAX");
        const delayTime = env.getNumber("CONNECTIVITY_CHECK_DELAY");
        
        let responded = false;
        const urlToTest = `https://discord.com/robots.txt`;
        for (let i = 0; i < max; i++) {
            if (BotState.shuttingDown)
                return console.log("Shutting down so not processing client any further");
            try {
                console.log("Checking internet availability at:", urlToTest);
                await fetch(urlToTest);

                // break out the loop on fetch
                console.log("Got a response back, should be fine to attempt login");
                responded = true;
                break;
            } catch {
                console.log("We seem offline, retrying in", delayTime, "ms;", i + 1, "of", max);
                await delay(delayTime);
            }
        }

        // abort the bot because we cant startup
        if (!responded)
            return await HostUtility.abort(`Failed to reach ${urlToTest} after ${max} attempts`);
    }

    // login to bot
    const token = isInTestMode ? env.get("TOKEN_TEST") : env.get("TOKEN");
    try {
        if (BotState.shuttingDown)
            return console.log("Shutting down so not processing client any further");
        await client.login(token);
    } catch (err) {
        // NOTE: We LITERALLY Cannot do anything in this case so this is a rare-case where we will abort the bot
        console.error('Login Error;', err);
        await HostUtility.abort(err);
        return;
    }

    // bot's logged in so lets start setting up the rest of the shits
    EventHandler.handleEvents(client, state);
})();
