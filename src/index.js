const nodeprocess = require('process');
const discord = require("discord.js");

const CommandUtility = new (require("./util/utility.js"))();
const BaseEventHandler = require('./handleEvents.js');
const env = require("./util/env-util.js");

const isInTestMode = process.argv[2] === 'test';
if (isInTestMode) {
    console.log('Launched in test mode');
}

// create client with stuff
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
nodeprocess.on('uncaughtException', (err) => {
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
    services: {}, // commands can add to this object themselves
    slash: {},
    prefix,
    isInTestMode,
    panelForcedDisabled: false,
    preventRuntimeChanges: env.getBool('PREVENT_UPDATES')
};
CommandUtility.state = state;

// login
client.login(isInTestMode ? env.get("TEST_TOKEN") : env.get("TOKEN")).catch((e) => {
    console.error('Login Error;', e);
    throw e; // we really only console.error to say where the error was
});

BaseEventHandler.handleEvents(client, state, isInTestMode);
