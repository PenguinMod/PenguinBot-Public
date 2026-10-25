const PenguinModClient = require("../../../util/penguinmod-client.js");

// TODO: put this in configuration
const statusChannelId = "1040401867924062259";

const responses = {
    unknown: "Our servers are probably down right now.",
    up: "Our servers seem to be online right now. It's possible something else may be wrong.",
    slow: "Our server seems to be unstable or slow at the moment.",
};
let currentResponse = responses.unknown;

// TODO: make it so you can Configure env to see if we should even do this
const intervalTime = 30 * 60 * 1000; // 30 minutes
const intervalCallback = async () => {
    const startTime = Date.now();
    try {
        const successful = await PenguinModClient.checkOnline();
        const currentTime = Date.now();
        const amountOfTime = currentTime - startTime;
        currentResponse = responses.unknown;
        if (successful) {
            currentResponse = responses.up;
            if (amountOfTime > 2500) {
                currentResponse = responses.slow
            }
        }
    } catch {
        currentResponse = responses.unknown;
    }

    console.log("cantlogin: pinged PenguinModClient.checkOnline() for cantlogin response;", currentResponse);
};
setInterval(intervalCallback, intervalTime);
intervalCallback();

const invoke = (message) => {
    message.reply("Can't sign in or upload projects? "
        + `${currentResponse}\n`
        + `Make sure to check <#${statusChannelId}> for PenguinMod server status updates.`);
};

module.exports = invoke;