const path = require('path');
const childProcess = require('child_process');

const env = require("./env-util");

// FYI, Canvas support is very rough with worker_threads for some reason. We use child_process to work around that.
const runNewThread = (workerSrc, commandSrc, serializableData, timeout) => {
    if (env.getBool("DISABLE_FORKING")) {
        console.log("forking disabled, creating fake fork of ", workerSrc);
        const runWorker = require(workerSrc);
        const promise = runWorker({ workerSrc, commandSrc, ...serializableData });
        return new Promise((resolve, reject) => {
            let completed = false;
            promise.then(result => {
                completed = true;
                resolve(result);
            });
            promise.catch(err => {
                reject(err);
            });
            
            if (timeout) setTimeout(() => {
                if (completed) return;
                console.warn("runNewThread cannot kill timed-out promises when forking is disabled."
                    + " " + "a heavy process may be running in the background, eating resources for no reason.");
                reject("Promise exceeded timeout");
            }, timeout);
        });
    }

    return new Promise((resolve, reject) => {
        workerSrc = path.resolve(workerSrc);
        commandSrc = path.resolve(commandSrc);

        // We provide commandSrc so all command logic is still in the same file.
        const child = childProcess.fork(workerSrc);
        child.send({ workerSrc, commandSrc, ...serializableData });

        let completed = false;
        const timeoutId = timeout ? setTimeout(() => {
            if (completed) return;
            // we assume the program missed the timeout because it was hung
            child.kill("SIGKILL");
            reject("Child process exceeded timeout");
        }, timeout) : null;

        child.on('message', (message) => {
            if (timeoutId) clearTimeout(timeoutId);
            child.kill();
            if (message.success) {
                completed = true;
                return resolve(message.result);
            }
            reject(message.error);
        });
        child.on('exit', (code) => {
            if (timeoutId) clearTimeout(timeoutId);
            if (completed) return;
            if (code === 0) return;
            reject(`Child process exited with code ${code}`);
        });
    });
};

module.exports = runNewThread;