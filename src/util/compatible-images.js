const compatibleImages = [
    'png', 'jpeg', 'jpg', 'webp', 'avif', 'gif',
    'heif', 'heic', 'x-tiff', 'tiff', 'quicktime',
    "svg", "svg+xml", "svg-xml",
];

const isCompatibleImage = (mimeEnding) => {
    return compatibleImages.includes(mimeEnding);
};

module.exports = isCompatibleImage;