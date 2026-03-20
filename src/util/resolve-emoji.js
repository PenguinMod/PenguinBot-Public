const resolveEmoji = (emoji, client) => {
    const customMatch = emoji.match(/<(a|):[a-z0-9_\-]+:(\d+)>/i) || emoji.match(/^(\d+)$/);
    if (customMatch) {
        const id = customMatch[2] || customMatch[1];
        const emojiData = client.emojis.cache.get(id);
        if (!emojiData) return null;

        return {
            type: emojiData.animated ? "animated" : "static",
            emoji: null,
            id: emojiData.id
        };
    }

    const unicodeRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    if (unicodeRegex.test(emoji)) {
        return {
            type: "unicode",
            emoji: emoji,
            id: null
        };
    }

    return null;
};

module.exports = resolveEmoji;