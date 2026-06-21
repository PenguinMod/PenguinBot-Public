const childProcess = require("child_process");

const isInTestMode = process.argv[2] === 'test';

const spawnProcess = () => {
    const args = ['--max-old-space-size=4096', 'src/index.js'];

    if (isInTestMode) {
        args.push('test');
    }
    const botProcess = childProcess.spawn('node', args);
    botProcess.stdout.on('data', (data) => {
        process.stdout.write(data.toString('utf8'));
    });
    botProcess.stderr.on('data', (data) => {
        console.log(data.toString('utf8'));
    });
    botProcess.once('close', (code) => {
        console.log('closed!', code);
        if (code === 50) {
            spawnProcess();
        } else {
            process.exit(1);
        }
    });
};

// Start the bot process
spawnProcess();
