// DISCLOSURE: tjhis is ai but like there's only one canon way to do this so
/**
 * Determines if a Buffer is a GIF file by checking its header.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const isGif = (buffer) => {
    if (!buffer || buffer.length < 6) return false;

    const isGifHeader = buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46;
    const isVersion = (buffer[3] === 0x38 && (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61);
    return isGifHeader && isVersion;
}

module.exports = isGif;