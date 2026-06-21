const path = require("path");
const discord = require("discord.js");
const systemInformation = require("systeminformation");

const configuration = require("../../config.js");

/** @param {NodeJS.Platform} platform */
const getPlatformEmoji = (platform) => {
    switch (platform) {
        case 'win32':
            return '🪟';
        case 'darwin':
            return '🍎';
        case 'linux':
            return '🐧';
        case 'freebsd':
            return '👹';
        case 'openbsd':
            return '🐡';
        case 'aix':
            return '🔷';
        case 'sunos':
            return '☀️';
        case "android":
            return '🤖';
        case "cygwin":
            return '🔧';
        case "haiku":
            return '🍃';
        case "netbsd":
            return '🚩';
        default:
            return '💻';
    }
}
/** @param {NodeJS.Platform} platform */
const getPlatformName = (platform) => {
    switch (platform) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'Darwin';
        case 'linux':
            return 'Linux';
        case 'freebsd':
            return 'FreeBSD';
        case 'openbsd':
            return 'OpenBSD';
        case 'aix':
            return 'AIX';
        case 'sunos':
            return 'SunOS';
        case "android":
            return 'Android';
        case "cygwin":
            return 'Cygwin';
        case "haiku":
            return 'Haiku';
        case "netbsd":
            return 'NetBSD';
        default:
            return typeof platform === "string" ? platform : "(unspecified)";
    }
}

class Command {
    constructor(client) {
        this.name = "stats";
        this.description = "Get internal server details about the bot.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: true,
        };

        this.client = client;
    }

    async invoke(message) {
        const startTime = Date.now();
        message.channel.sendTyping();

        const embed = new discord.MessageEmbed();
        embed.setColor("#00c3ff");
        embed.setTitle('Statistics');

        // get Info
        const penguinBotPath = path.resolve(__dirname, __filename);
        const penguinBotName = configuration.nameBotReference;
        const cpu = await systemInformation.cpu();
        const cpuLoad = await systemInformation.currentLoad();
        const cpuSpeedData = await systemInformation.cpuCurrentSpeed();
        const cpuTempData = await systemInformation.cpuTemperature();
        const mem = await systemInformation.mem();
        const graphics = await systemInformation.graphics();
        const battery = await systemInformation.battery();
        const disk = await systemInformation.fsSize();
        // remove virtual controllers
        const gpus = graphics.controllers.filter(controller => !!controller.bus);
        gpus.sort((a, b) => (b.vram || 0) - (a.vram || 0));
        // CPU - fill info vars
        const cpuUsage = cpuLoad.currentLoad.toFixed(0);
        const cpuSpeed = cpuSpeedData.avg;
        const cpuSpeedMax = cpu.speedMax;
        const cpuTemp = cpuTempData.main;
        const cpuCores = cpu.physicalCores;
        const cpuLogicalProcessors = cpu.cores;
        const cpuName = `${cpu.manufacturer} ${cpu.brand}`;
        // RAM
        const ramUsed = (mem.used / 1024 / 1024 / 1024).toFixed(1);
        const ramMax = (mem.total / 1024 / 1024 / 1024).toFixed(0);
        const ramUsedPercentage = ((mem.used / mem.total) * 100).toFixed(1);
        // VRAM & GPU (definition)
        const vramInfo = [];
        const gpuInfo = [];
        // VRAM & GPU
        for (const gpu of gpus) {
            const vramUsed = (gpu.memoryUsed / 1024).toFixed(1);
            const vramMax = ((gpu.memoryTotal || 0) / 1024).toFixed(0);
            const vramUsedPercentage = ((gpu.memoryUsed / gpu.memoryTotal) * 100).toFixed(1);
            const gpuUsage = (gpu.utilizationGpu || 0).toFixed(0);
            const gpuTemp = gpu.temperatureGpu;
            if (gpu.memoryTotal) vramInfo.push({ vramUsed, vramMax, vramUsedPercentage });
            gpuInfo.push({ gpuUsage, gpuTemp });
        }
        // Battery
        const batteryAvailable = battery.hasBattery;
        const batteryPercentage = battery.percent;
        const batteryCharging = battery.isCharging;

        // fill out info
        embed.addFields({
            name: 'Server Host Details',
            value: `${getPlatformEmoji(process.platform)} ${getPlatformName(process.platform)} ${process.arch} on Node ${process.version}`,
            inline: false
        }, {
            name: 'CPU',
            value: `${cpuUsage}% ${cpuSpeed} GHz${typeof cpuTemp === "number" ? " " + `(${cpuTemp} °C)` : ""}`
                + "\n" + `${cpuCores}-Core (${cpuLogicalProcessors} LPs)`,
            inline: true
        }, {
            name: `RAM${vramInfo.length > 0 ? " " + `+ VRAM${vramInfo.length > 1 ? " " + `(${vramInfo.length})` : ""}` : ""}`,
            value: `${ramUsed}/${ramMax} GB (${ramUsedPercentage}%)`
                + (vramInfo.length > 0 ? "\n" + vramInfo.map(info => `${info.vramUsed}/${info.vramMax} GB (${info.vramUsedPercentage}%)`).join("\n") : ""),
            inline: true
        }, ...(gpuInfo.length > 0 ? [{
            name: `GPU${gpuInfo.length > 1 ? ` (${gpuInfo.length})` : ""}`,
            value: gpuInfo.map(info => `${info.gpuUsage}%${typeof info.gpuTemp === "number" ? " " + `(${info.gpuTemp} °C)` : ""}`).join("\n"),
            inline: true
        }] : []), {
            name: 'Disk',
            value: (disk.map(info => `${info.mount} (${info.use.toFixed(2)}%)${penguinBotPath.startsWith(info.mount) ? " " + `> ${penguinBotName} 👋` : ""}`).join("\n")) || "*(none?)*",
            inline: false
        }, {
            name: 'Specifications',
            value: `${cpuName} ${cpuSpeedMax} GHz`
                + (gpus.length > 0 ? "\n" + gpus.map(gpu => gpu.model).join("\n") : ""),
            inline: false
        });

        const footerElements = [`⏰ ${Date.now() - startTime}ms`];
        if (gpus.length > 1) footerElements.push(`${gpus.length} GPUs`);
        if (batteryAvailable) footerElements.push(`Battery: ${batteryPercentage}% ${batteryCharging ? "🔌" : "🔋"}`);
        embed.setFooter({
            text: footerElements.join(` | `)
        });

        message.reply({
            embeds: [embed]
        });
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;