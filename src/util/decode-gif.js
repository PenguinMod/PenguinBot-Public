const { Jimp: jimp, JimpMime } = require('jimp');
const OmgGif = require("omggif");
const GifReader = OmgGif.GifReader;
const { loadImage } = require('canvas');

const decodeGif = async (buffer, exportType) => {
    const gifReader = new GifReader(new Uint8Array(buffer));
    const numFrames = gifReader.numFrames();
    const gifFrames = [];

    let mainImage = new jimp({ width: gifReader.width, height: gifReader.height });

    for (let i = 0; i < numFrames; i++) {
        const framePixels = [];
        const { x, y, width, height, disposal } = gifReader.frameInfo(i);

        gifReader.decodeAndBlitFrameRGBA(i, framePixels);
        for (let row = 0; row < height; row++) {
            for (let column = 0; column < width; column++) {
                const indexOffset = 4 * (x + (y * gifReader.width));
                const j = indexOffset + (4 * (column + (row * gifReader.width)));
                if (framePixels[j + 3]) {
                    mainImage.bitmap.data[j + 0] = framePixels[j + 0];
                    mainImage.bitmap.data[j + 1] = framePixels[j + 1];
                    mainImage.bitmap.data[j + 2] = framePixels[j + 2];
                    mainImage.bitmap.data[j + 3] = framePixels[j + 3];
                }
            }
        }

        if (exportType === "buffer") {
            gifFrames.push(await mainImage.getBuffer(JimpMime.png));
        } else if (exportType === "canvas") {
            const buffer = await mainImage.getBuffer(JimpMime.png);
            gifFrames.push(await loadImage(buffer));
        } else {
            gifFrames.push(mainImage.clone());
        }

        // Handle disposal method
        switch (disposal) {
            case 2: // "Return to background", blank out the current frame
                mainImage = new jimp({ width: gifReader.width, height: gifReader.height });
                break;
            default:
                // we dont implement method 3, see below for info
                // https://groups.google.com/g/borland.public.delphi.graphics/c/ex6WrnhZaJM
                break;
        }
    }

    return {
        reader: gifReader,
        frames: gifFrames,
    };
};

module.exports = decodeGif;
