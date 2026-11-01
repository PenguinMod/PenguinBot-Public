const fs = require("node:fs/promises");
const path = require("node:path");
const events = require("node:events");

const glob = require("glob");

const BotState = require("./bot-state.js");

class BotEventEmitter extends events.EventEmitter {
    constructor(options) {
        super(options);

        /** @private Used to tell if we've already ran all the ready events */
        this._ready = false;
        /** @private Used to tell if we've already ran all the eventsReady events */
        this._eventsReady = false;
    }
    
    /**
     * Waits until BotState.initialized. If it's already true, this resolves instantly.
     * 
     * The purpose of these helpers is to aid events in making sure that they don't start allowing users to run things in the bot before they've loaded.
     */
    async ready() {
        if (this._ready)
            return;

        return new Promise((resolve) => {
            this.once("ready", () => {
                this._ready = true;
                resolve();
            });
        });
    }
    /**
     * Waits until BotState.initializedEvents. If it's already true, this resolves instantly.
     * This does not wait until all events have fired, it just waits until all events have been loaded from their files.
     * 
     * The purpose of these helpers is to aid events in making sure that they don't start allowing users to run things in the bot before they've loaded.
     * This helper is mostly used by the `ready` event to make sure that the bot isn't marked as initialized before all events have loaded.
     */
    async eventsReady() {
        if (this._eventsReady)
            return;

        return new Promise((resolve) => {
            this.once("eventsReady", () => {
                this._eventsReady = true;
                resolve();
            });
        });
    }

    /**
     * States BotState.initialized
     */
    markReady() {
        BotState.initialized = true;
        this._ready = true;
        this.emit("ready");
    }
    /**
     * States BotState.initializedEvents
     */
    markEventsReady() {
        BotState.initializedEvents = true;
        this._eventsReady = true;
        this.emit("eventsReady");
    }

    /**
     * Starts initializing events and sets BotState.initializedEvents
     * Should only be called once in the life-cycle of the bot
     */
    async initializeEvents() {
        if (BotState.initializedEvents)
            throw new Error("Already initialized events");

        // NOTE: If any of the events fail to even setup then that's probably something we should error on
        // NOTE: Previous versions of the event loader would send arbitrary args; now, we send only the actual incoming args to each event (and they dont depend on folder names)
        const folderFiles = await glob.glob('./src/events/**');
        const files = folderFiles
            .map(file => `../events/${file.replace(/\\/g, '/').replace('src/events/', '')}`)
            .filter(file => file.endsWith('.js'));
        for (const fileName of files) {
            console.log("Loading event", fileName);
            const imported = await import(fileName);
            const baseEvent = imported.default;

            /** @type {import("../classes/base-bot-event.js")} */
            const event = new baseEvent();
            if (event.productionOnly && BotState.state.isInTestMode)
                continue;
            
            if (event.once) {
                event.handler.once(event.listener, (...args) => event.invoke(...args));
            } else {
                event.handler.on(event.listener, (...args) => event.invoke(...args));
            }
        }

        // set the flag
        console.log("initializedEvents and firing eventsReady");
        BotState.initializedEvents = true;
        this.markEventsReady();
    };
}

module.exports = new BotEventEmitter();
