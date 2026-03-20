const QuickReplyCommand = require("../../basecommands/quickreply");

class ScratchAuthCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "scratchauth";
        this.description = "ScratchAuth Quick Reply";
        this.message = "If you have errors logging in using Scratch, it is most likely an issue with Scratch Wiki OAuth2. We use a login method provided by part of the Scratch Wiki since it is pretty reliable, but it might go down every now and then. When you are able to login with Scratch, try adding another login method or setting a password for your account.";
        this.alias = ["scratchlogin"];
    }
}
class DesktopCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "desktop";
        this.description = "Desktop Quick Reply";
        this.message = "The PenguinMod Desktop app is a planned project the PenguinMod developers want to make soon. It is not a thing yet.\nThe best third-party alternative for now is an unofficial PenguinMod Desktop app named \"Desk-Penguin\" made by TheShovel.\n<https://github.com/TheShovel/Desk-Penguin> (this is an unofficial project, not affiliated with PenguinMod.)";
    }
}
class RankupCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "rankup";
        this.description = "Rankup Quick Reply";
        this.message = "The rank requirement is essential to making the website easier to moderate for us. We've seen custom extensions be exploited by new users very easily, so we want to slow that down. **To rank up, upload 3 projects or more and wait 5 days since you first logged in**, or skip those and earn a badge like getting your project featured, having a lot of likes on your project, or supporting PenguinMod.";
    }
}
class LoadSB3Command extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "loadsb3";
        this.description = "Load .sb3 Quick Reply";
        this.message = "Want to load your TurboWarp or Scratch project into PenguinMod?\n"
            + "Try this tutorial! https://discord.com/channels/1033551490331197462/1181430242963902565\n"
            + "Note that PenguinMod may be incompatible with Custom Block reporters or complicated custom extensions.";
    }
}
class CollabCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "collab";
        this.description = "Collab/Blocklive Quick Reply";
        this.message = "A collaboration system for projects is a cool idea, but we currently don't know if this would be possible to implement without tons of time or money.";
        this.alias = ["blocklive"];
    }
}
class CommentCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "comment";
        this.description = "Comment Quick Reply";
        this.message = "We have not added comments to PenguinMod since there is not a reliable, safe and cheap way to moderate the comments to make sure the platform is safe for all ages.";
    }
}
class StudioCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "studio";
        this.description = "Studio Quick Reply";
        this.message = "Studios would be a cool feature to add to PenguinMod, but we have a lot more important things to add first. They will hopefully be added eventually, but don't expect or ask for a specific timeframe right now.";
    }
}
class ServerCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "server";
        this.description = "Server Quick Reply";
        this.message = "If you are having issues with the PenguinMod servers, it's likely there is a small issue causing the servers to be unavailable. Downtime will be mentioned in <#1040401867924062259> if major reasons are causing downtime.";
        this.alias = ["serverdown"];
    }
}
class SHCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "scratchhelp";
        this.description = "Scratch Help Quick Reply";
        this.message = "This server is intended to help you with PenguinMod projects. If you specifically need Scratch help, check out other Scratch servers like <https://discord.gg/7gfPrhWwb2> (Scratch Community) or go on the Scratch forums.";
        this.alias = ["scratchelp"];
    }
}
class GoochCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "gooch";
        this.description = "Who was here?";
        this.message = "Sir William Gooch was here.";
    }
}
class MyStuffCommand extends QuickReplyCommand {
    constructor() {
        super();
        this.name = "mystuff";
        this.description = "My Stuff Quick Reply";
        this.message = "There is no way to save in-progress projects to the server in PenguinMod. Unlike Scratch, we don't have the resources to do something like this. We only have a limited amount of storage space and we can't dedicate it to hosting thousands of unfinished projects safely. We also don't want to get in the way of working on your projects if the servers ever go down for a long amount of time.";
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = {
    scratchauth: ScratchAuthCommand,
    desktop: DesktopCommand,
    rankup: RankupCommand,
    loadsb3: LoadSB3Command,
    collab: CollabCommand,
    comment: CommentCommand,
    studio: StudioCommand,
    server: ServerCommand,
    scratchhelp: SHCommand,
    gooch: GoochCommand,
    mystuff: MyStuffCommand,
};
