const sharp = require('sharp');

const makePng = async (buffer) => {
    const pngBuffer = await sharp(buffer)
        .png()
        .toBuffer();
    return pngBuffer;
};

module.exports = makePng;