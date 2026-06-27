const fs = require("fs/promises");
const path = require("path");

const math = require('mathjs');

const env = require("./env-util");
const runNewThread = require('./multi-thread');

const mathEvaluateRaw = (expression) => {
    // "" is undefined when evalutated
    if (expression.trim().length === 0) return 0;
    // evalueate
    let answer = 0;
    try {
        answer = math.evaluate(expression);
    } catch {
        // syntax errors cause real errors
        answer = 0;
    }
    // multiline or semi-colon breaks create a ResultSet, we can get the last item in the set for that
    if (typeof answer === "object") {
        if ("entries" in answer) {
            const answers = answer.entries;
            if (answers.length === 0) return 0;
            const lastIdx = answers.length - 1;
            return parseFloat(answers[lastIdx]);
        }
    }
    return parseFloat(answer);
};

const mathEvaluateThread = async (expression) => {
    if (env.getBool("DISABLE_FORKING"))
        return mathEvaluateRaw(expression);

    // create a new thread
    const workerPath = path.join(__dirname, "../resources/worker/math-evaluate.worker.js");
    const result = await runNewThread(workerPath, path.resolve(__dirname, __filename), { expression }, 30 * 1000);
    return Number(result);
};

module.exports = {
    mathEvaluateThread,
    mathEvaluateRaw,
};
