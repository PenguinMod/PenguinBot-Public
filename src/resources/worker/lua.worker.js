const fs = require('fs/promises');
const path = require('path');
const { stringify } = require('../../util/json-circular.js');

const Lua = require("../../util/lua.js");

const MAX_BYTES = 1 * 1024 * 1024 // 1mb

const runWorker = async (data) => {
    const { luaCode } = data;
    return await Lua._evaluate(luaCode);
};

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
process.on('message', async (data) => {
    try {
        const result = await runWorker(data);
        const serializedResult = stringify(result);
        if (Buffer.byteLength(serializedResult, 'utf8') > MAX_BYTES) 
            throw new Error("Result is larger than 1 MB");
        process.send({ success: true, result: serializedResult });
    } catch (err) {
        process.send({ success: false, error: err.message });
    } finally {
        // this process wont close by itself, so we exit with code 0 to denote we successfully finished everything
        process.exit(0);
    }
});

module.exports = runWorker;
