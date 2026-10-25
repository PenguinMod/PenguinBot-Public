const fs = require('fs');
const path = require('path');

const configuration = require("../config.js");

const env = require("../util/env-util.js");
const HostUtility = require("../util/utility-host.js");

const isInTestMode = HostUtility.launchMode === "test";
if (isInTestMode) {
    console.log('Launched WEB PANEL in test mode');
}

const handleDoAction = async (req, res, client, state) => {
    if (!req.body) return res.status(400).send("-1");
    if (req.body.username !== env.get("WEB_PANEL_USERNAME")) return res.status(403).send("-1");
    if (req.body.password !== env.get("WEB_PANEL_PASSWORD")) return res.status(403).send("-1");

    switch (req.body.action) {
        case 'validate':
            res.status(200).send('done');
            return;
        case 'restart': {
            res.status(200).send('restarting');

            const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
            await mainChannel.send({
                content: "Restart triggered from remote, please wait..."
            });
            await HostUtility.restart();
            return;
        }
        case 'sendmsg': {
            const mainChannel = await client.channels.cache.get(configuration.channels.botTestingChannel);
            await mainChannel.send({
                content: String(req.body.text)
            });

            res.status(200).json({ success: true });
            return;
        }
        default:
            res.status(403).send("-1");
            return;
    }
};

module.exports = handleDoAction;
