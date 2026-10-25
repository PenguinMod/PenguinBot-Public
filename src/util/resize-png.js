const sharp = require('sharp');

// DISCLOSURE: gpt-oss did this while i did dishes because mathing this out lowk less fun
const resizePng = async (buffer, area) => {
    // Get original image metadata to determine dimensions
    const { width: origWidth, height: origHeight } = await sharp(buffer).metadata();

    // Calculate current pixel count and compare with desired area
    const currentArea = origWidth * origHeight;
    
    // Determine scaling factor to fit within the target area while preserving aspect ratio
    const scale = Math.sqrt(area / currentArea);
    const newWidth = Math.max(1, Math.floor(origWidth * scale));
    const newHeight = Math.max(1, Math.floor(origHeight * scale));

    return await sharp(buffer)
        .resize(newWidth, newHeight)
        .png()
        .toBuffer();
};

module.exports = resizePng;
