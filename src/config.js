const env = require("./util/env-util");

// Seperated from .env since these are mostly cosmetic changes or big lists.
const configuration = {
    // Used in cases like "Welcome to the {NAME} server!" and "Do not post NSFW invites in the {NAME} server."
    nameReference: "PenguinMod",
    // The name of your bot (some files like the credits command will still say PenguinBot, since this is PenguinBot's code)
    nameBotReference: "PenguinBot",

    // Status of the bot, stated in Discord like "Playing (text)" or "Playing a game" then, on a new line "(text)"
    status: {
        // The bot can use seperate text when running in test mode.
        // Note that the .env variables are available here if you use stuff like {{NAME}}, avoid using something like {{TOKEN}} or {{PENGUINMOD_PASSWORD}}
        normal: "{{PREFIX}}help | PenguinMod",
        testing: "{{PREFIX_TEST}}help | PenguinBot Testing",
    },

    // The bot has many auto responses, toggled using the RESPOND_TO_KEYWORDS env. They will only be usable in these channels:
    autoResponseChannels: [
        // These are the channels used in PenguinMod's server:
        // dont include things like bug reports or suggestions
        '1038238583686967428', // penguin-chat
        '1161202733269930075', // vip-chat
        '1052023660594081862', // projects
        '1038236110335266907', // off-topic
        '1038251459843723274', // commands
        '1038261660164563044', // old-secret-penguin-chat
        '1161439112096665711', // one-minute-and-37-seconds
        '1139749855913316474', // penguinbot-test
    ],

    // Used to link to channels within the server. These IDs are the ones we use in PenguinMod.
    channels: {
        // A channel for PenguinBot testing and occasional logging.
        botTestingChannel: "1139749855913316474",

        // A channel dedicated to bot commands.
        commands: "1038251459843723274",

        // A channel dedicated to bot commands for developers.
        commandsDev: "1174359501688803358",

        // The channel where blocked automod alerts are sent. PenguinBot will send automod bypass alerts here too, if the basic_automod file is added.
        // See src/util/utility.js to see where basic_automod is used.
        automod: "1335746419193151598",

        // A channel where PenguinBot can send reported users to. Usable via /report
        userReports: "1174360726765305987",

        // A channel where PenguinBot can send reported mods to. Usable via /modreport
        adminReports: "1214727525607936020",

        help: "1090809014343974972",
        spaces: "1181097377730400287",
        teamWanted: "1095867529169207416",
        spam: "1040077506029551647",
    },

    permissions: {
        // Permission Level 1: A low permission level that isnt used much.
        permission1: [
            "1170911460948451438", // Bot Developer
        ],
        // Permission Level 2: Reserved for moderator commands.
        permission2: [
            "1161720252913168474", // Discord Mods
            "1173376969900052492", // Secondary Mods
        ],
        // Permission Level 3: Mostly developer commands.
        permission3: [
            "1038234739708006481", // Developer
            "1081053191602450552", // Retired Developer
        ],

        // User IDs that can always use donator commands:
        exclusiveUsers: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // Role IDs considered "exclusive", so Server booster & Donator
        exclusiveRoles: [
            "1150383694842953778", // Donator
            "1102050296265445436", // Server Booster
        ],

        // Channels checked for in the lockedToCommands property (excluding commands channel from above & threads within that channel)
        lockedToCommands: [
            // These are the channels allowed in PenguinMod's server:
            '1143305846227476511', // dev-github-logs
            '1038251742439149661', // dev-chat
            '1139749855913316474', // penguinbot-test
            '1146290116583751681', // web-mod-chat
            '1038252107846930513', // server-mod-chat
            '1176024649390366780', // admin-chat
            '1176024748300443698', // admin-furry-rp
            '1126699478607470652', // mod-furry-rp
        ],

        // On top of the permission check, who can use pm!eval (run custom code)
        eval: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!echo
        echo: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!delmsg
        delmsg: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // On top of the permission check, who can use pm!penguinbotupload
        penguinbotupload: [env.get("OWNER"), "462098932571308033", "567307285324496897"],

        // Who can use "force" options in pm!exclusiverole
        exclusiveroleForce: [env.get("OWNER"), "462098932571308033", "567307285324496897"],
    },
};

module.exports = configuration;
