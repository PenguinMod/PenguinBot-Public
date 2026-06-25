const fs = require('fs/promises');
const path = require('path');

const ScratchBlocks = require("../util/scratchblocks.js");

const runWorker = async (data) => {
    const { workerSrc, commandSrc, requestId, tempFile, scratchblocksString } = data;
    const imageBuffer = await ScratchBlocks._render(scratchblocksString);
    await fs.writeFile(tempFile, imageBuffer);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        await runWorker(data);
        process.send({ success: true });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;
