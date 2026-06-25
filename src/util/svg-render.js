const sharp = require('sharp');

/**
 * @param {number?} dpi Number representing the DPI for vector images in the range 1 to 100000. (optional, default 72)
 */
const svgRender = async (svgString, dpi) => {
    const buffer = Buffer.from(svgString, "utf8");
    const pngBuffer = await sharp(buffer, { density: dpi })
        .png()
        .toBuffer();
    return pngBuffer;
};

module.exports = svgRender;