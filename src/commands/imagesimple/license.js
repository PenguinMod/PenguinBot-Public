const { createCanvas, loadImage } = require('canvas');
const Discord = require("discord.js");

class LicenseCommand {
    constructor() {
        this.name = "license";
        this.description = "Generates a license with user's avatar.";
        this.attributes = {
            unlisted: false,
            permission: 0,
            lockedToCommands: false,
        };
    }

    async invoke(message, args) {
        // Load user's avatar
        const userAvatar = await loadImage(message.author.displayAvatarURL({ format: 'png', size: 256 }));

        // Load the license template
        const licenseTemplate = await loadImage('assets/license.png');

        // Create a canvas
        const canvas = createCanvas(licenseTemplate.width, licenseTemplate.height);
        const ctx = canvas.getContext('2d');

        // Draw the license template
        ctx.drawImage(licenseTemplate, 0, 0, canvas.width, canvas.height);

        // Draw the user's avatar on the license template at position (140, 180) with a larger size
        ctx.drawImage(userAvatar, 50, 100, 210, 210); // Adjust the size and position as needed

        function getRandomChar() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const licenseText = args.join(" ").replace(/\n/g, ' ');
        ctx.font = 'bold 30px Arial'; // Set font size, type, and weight
        ctx.fillStyle = '#000000'; // Set text color
        ctx.textAlign = 'center'; // Center the text horizontally
        ctx.fillText(licenseText, canvas.width / 2, 45, 475); // Draw the text at y-coordinate 35

        // Add additional text lines manually
        ctx.font = 'bold 20px Arial'; // Set font size, type, and weight for additional text
        ctx.textAlign = "left";
        ctx.fillStyle = '#000000'; // Set text color for additional text

        // Text Line 1
        ctx.fillText(message.author.username, 275, 140);

        // Text Line 2
        const formattedDate = new Date().toLocaleDateString('en-US');
        ctx.fillText(formattedDate, 275, 210);

        // Text Line 3
        const formattedRandomDate = new Date(Date.now() + Math.random() * (100 * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US');
        ctx.fillText(formattedRandomDate, 275, 275);

        const sequence = "ID: " + Array.from({ length: 10 }, () => getRandomChar()).join('');
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 60%)'; // Black color with 60% opacity
        ctx.fillText(sequence, 50, 330);
        
        // Convert the canvas to a Discord attachment
        const attachment = new Discord.MessageAttachment(canvas.toBuffer("image/png"), 'license.png');

        // Send the license image as a reply
        message.reply({ files: [attachment] });
    }
}

module.exports = LicenseCommand;
