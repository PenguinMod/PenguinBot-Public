const axios = require('axios');

class Command {
    constructor() {
        this.name = "triggered";
        this.description = "Generates a triggered overlay for a given avatar";
        this.attributes = {
            unlisted: false,
            admin: false,
            exclusive: true,
        };
    }

    async invoke(message, args) {
        let avatar;
        const user = message.mentions.users.first();

        if (user) {
            avatar = user.avatarURL({ format: 'png', dynamic: true, size: 1024 });
        } else {
            avatar = message.author.avatarURL({ format: 'png', dynamic: true, size: 1024 }); 
        }

        if (!avatar) {
            message.channel.send("Could not find a valid avatar.");
            return;
        }

        try {
            const response = await axios.get(`https://some-random-api.com/canvas/overlay/triggered?avatar=${avatar}`, {
                responseType: 'arraybuffer'
            });

            message.channel.send({
                files: [{
                    attachment: Buffer.from(response.data),
                    name: 'triggered_overlay.png'
                }]
            });

        } catch (error) {
            console.error("Error fetching image:", error);
            message.channel.send("Error fetching the image. Please try again later.");
        }
    }
}

module.exports = Command;