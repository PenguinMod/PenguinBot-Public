# PenguinBot-Public
A stripped-down public version of PenguinBot.
Certain features or commands may be missing from this repository.

If you want to restructure the codebase in any way and submit it as a PR, please note we may be very strict about it since we will have to make all of our future contributions under the format of your changes. Ideally, don't mess with how commands are defined but it's cool if you move around folders, modules, classes, or functions & such to reduce clutter.

# Notes
Discord is a much more casual & non-serious place for people to chat in our view.
If you see swear words or immature jokes in the source of PenguinBot, this is why. Sorry about that, don't put this code on your resume. :P

This bot was originally built to be a Private Bot for PenguinMod's Discord Server. There has been changes made to make the bot mostly universal, but if you have any issues relating to server, role, member, or channel specific features not working, this is likely why.

You can edit most of these Discord-specific features in the `src/config.js` file. More complicated checks may be present in the `src/util/utility.js` file or `src/events/client` folder.
Most other things will just be command-specific checks or custom emojis being used.

The bot uses many assets that cannot be released inside of this repo.

You can find them here:
https://drive.google.com/file/d/1TwvCSmPvxthxB1taJ4c-1wrxhgVhLEl1/view?usp=sharing

Note that **fonts are not included** in this download.

For the most part, you need a good understanding of JavaScript and JSON to make commands or do anything meaningful with the code of this bot.

# License
The code found in this repository is licensed under the MIT license.
Please let us know if this is incorrect or invalid.

The `assets` folder is **NOT** under this license. Content in there may be licensed under, literally anything.

# Setup
**Please CLONE this repository properly with Git, do not download it as a ZIP.**
If you do not do this, many commands relating to managing the GitHub repository will cause undefined behavior.

1. Install Node.js, preferably v18 or v20. **Newer versions of Node may not be compatible out of the box with Canvas or other modules yet.**
2. Install FFMPEG. Easiest way to check if it's setup properly is to run `ffmpeg` in a terminal with no arguments.
3. Install Git
4. Create a `cache`, `databases`, `temp`, and `memes` folder in the root folder for PenguinBot.
5. Download the `assets` folder in the link found in the Notes section, and put it in the root folder for PenguinBot.
6. Install all of the node modules with `npm ci` or `npm i`
    - If you have `nvm` installed to switch between Node installations, you may need to rebuild canvas when switching versions by using `npm rebuild canvas`
7. Duplicate `.env.template` and rename it to `.env`, then fill any of the information you can.
    - Certain keys are used only when the bot is ran with `npm run test`, notably the `TEST_TOKEN`.
8. Run the bot with `npm run test` for development and `npm start` or `node permrun.js` for production.
    - If you want to run the bot once in development, use `node src/index.js test`. This is not recommended for production as the bot can be restarted via commands.
    - When the bot is online, you can use the `restart` command in Discord to restart the bot.

Check the Notes section for details on customizing PenguinBot to your liking.

# Basic Commands Template
```js
const OptionType = require('../util/optiontype');

class Command {
    constructor() {
        this.name = "base";
        this.description = "Description";
        this.attributes = {
            unlisted: true,
            permission: 3
        };
    }

    invoke(message) {

    }
}

module.exports = Command;
```

# Signoffs
Have a good life! Don't ever think you can't do something, you always can when you're programming something.

- MubiLop | 08/02/2024
