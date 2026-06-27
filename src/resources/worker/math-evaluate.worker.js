const fs = require('fs/promises');
const path = require('path');

const { mathEvaluateRaw } = require("../../util/math-evaluate.js");

const runWorker = async (data) => {
    const { expression } = data;
    return mathEvaluateRaw(expression);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        const result = await runWorker(data);
        process.send({ success: true, result: result });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;
