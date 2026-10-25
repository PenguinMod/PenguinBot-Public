const path = require('path');

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const env = require("../../util/env-util.js");
const BotState = require("../../util/bot-state.js");

const app = express();

class BotEvent {
    constructor(client) {
        this.listener = "ready";
        this.once = true;

        this.client = client;
    }

    async invoke(client, state) {
        if (!env.getBool("WEB_PANEL_ENABLED")) return;
        
        const handleDoAction = require('../../admin/server');
        
        const port = env.getNumber("WEB_PANEL_PORT");
        console.log("Attempting to setup Web Panel...");
        console.log("Running in", __dirname);

        app.use(cors({
            origin: '*',
            optionsSuccessStatus: 200
        }));
        app.use(bodyParser.urlencoded({
            limit: '10kb',
            extended: false
        }));
        app.use(bodyParser.json({ limit: '10kb' }));

        app.get('/', async function (_, res) {
            res.sendFile(path.join(__dirname, './../../admin/index.html'));
        });
        app.get('/robots.txt', async function (_, res) {
            res.sendFile(path.join(__dirname, './../../admin/robots.txt'));
        });
        app.get('/panel', async function (_, res) {
            res.sendFile(path.join(__dirname, './../../admin/panel.html'));
        });

        app.get('/files/examples/:name', async function (req, res) {
            const fileName = req.params.name;
            const filePath = path.join(__dirname, '../../../assets/examples', fileName);
            
            res.sendFile(filePath, err => {
                if (err) {
                    console.error(`Error sending file: ${fileName}`, err);
                    res.status(404).send('File not found');
                }
            });
        });

        app.post('/doaction', async function (req, res) {
            if (state.panelForcedDisabled) {
                res.status(403);
                res.send('-2');
                return;
            }
            handleDoAction(req, res, client, state);
        });
        
        if (BotState.shuttingDown)
            return;
        const server = app.listen(port, () => console.log('Started web panel on port', port));
        BotState.server = server;
    }
}

module.exports = BotEvent;