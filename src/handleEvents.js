const fs = require("fs");
const path = require("path");

const createEventsWithArgs = (client, state, folder, eventFiles, ...eventArgs) => {
    for (const file of eventFiles) {
        const baseEvent = require(`./events/${folder}/${file}`);
        const event = new baseEvent(client);

        if (event.productionOnly && state.isInTestMode) continue;

        if (event.once) {
            client.once(event.listener, (...args) => event.invoke(...eventArgs, ...args));
        } else {
            client.on(event.listener, (...args) => event.invoke(...eventArgs, ...args));
        }
    }
};
const handleEvents = (client, state) => {
    // each folder in the events folder will have different args passed to the event files within
    const eventFolder = fs.readdirSync(path.join(__dirname, `./events`));
    for (const folder of eventFolder) {
        const eventFiles = fs.readdirSync(path.join(__dirname, `./events/${folder}`))
            .filter(file => file.endsWith(`.js`));
        
        // this is where the event files in each folder are given their args
        switch (folder) {
            default: // client & guilds
                createEventsWithArgs(
                    client, state, folder, eventFiles,
                    client, state, // event args
                );
                break;
        }
    }
};

module.exports = {
    handleEvents,
    createEventsWithArgs,
};