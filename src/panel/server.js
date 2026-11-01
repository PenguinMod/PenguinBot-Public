const fs = require('fs/promises');
const path = require('path');
const events = require('node:events');

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const authBearerParser = require('auth-bearer-parser').default;

const configuration = require("../config.js");

const env = require("../util/env-util.js");
const BotState = require("../util/bot-state.js");
const HostUtility = require("../util/utility-host.js");
const BotEventEmitter = require('../util/bot-event-emitter.js');

const serverPort = env.getNumber("WEB_PANEL_PORT");
const serverInterface = env.get("WEB_PANEL_INTERFACE");
const serverToken = env.get("WEB_PANEL_TOKEN");
const validationMiddleware = (req, res, next) => {
    if (BotState.shuttingDown)
        return res.status(403).json({ error: "Shutting down" });
    if (req.token !== serverToken)
        return res.status(403).json({ error: "Unauthorized" });
    next(); // Passes control to the next middleware/route
};

class WebPanel extends events.EventEmitter {
    constructor(options) {
        super(options);
        
        /**
         * The server created after initialize
         * @type {import("http").Server}
         */
        this.server = null;
        /**
         * The router made for /api endpoints
         * @type {import("express").Router}
         */
        this.router = null;
    }

    /**
     * Initializes and sets up the server to be saved to BotState.
     * @returns {import("http").Server}
     */
    initialize() {
        if (!env.getBool("WEB_PANEL_ENABLED"))
            throw new Error("Web panel is disabled");
        
        // start up[]
        const isInTestMode = HostUtility.launchMode === "test";
        console.log("Attempting to setup Web Panel...");
        console.log("Running in", __dirname);
        if (isInTestMode)
            console.log('Launching WEB PANEL in test mode');

        const app = express();
        app.use(authBearerParser());
        app.use(cors({
            origin: '*',
            optionsSuccessStatus: 200
        }));
        app.use(bodyParser.urlencoded({
            limit: '10kb',
            extended: false
        }));
        app.use(bodyParser.json({ limit: '10kb' }));

        // need to define endpoints first
        const router = express.Router();
        router.use(validationMiddleware);
        app.use('/api', router);
        this.router = router;

        // serve static content
        const rootDir = path.join(__dirname, "../../");
        app.use("/assets", express.static(path.join(rootDir, "assets"), {
            fallthrough: false,
            index: false,
        }));
        app.use("/temp", validationMiddleware);
        app.use("/temp", express.static(path.join(rootDir, "temp"), {
            fallthrough: false,
            index: false,
        }));
        app.use(express.static(path.join(__dirname, "static"), {
            extensions: ["html"],
            index: "index.html",
            fallthrough: true,
        }));
        
        // listen up
        if (BotState.shuttingDown)
            return;
        const server = app.listen(serverPort, serverInterface, () => {
            console.log('Started web panel on port', serverPort, "on interface", serverInterface);
            this.emit("ready");
        });
        this.server = server;
        BotState.server = server;
    }
}

module.exports = new WebPanel();
