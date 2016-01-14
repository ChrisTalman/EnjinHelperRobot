module.exports = updateRobot;

function updateRobot()
{
	spawnUpdater();
	process.exit();
};

function spawnUpdater()
{
	const fs = require('fs');
	const spawn = require('child_process').spawn;
	const out = fs.openSync(global.appPath('Data/updateOutput.txt'), 'a');
	const err = fs.openSync(global.appPath('Data/updateErrors.txt'), 'a');

	const child = spawn('update.sh', [], {
		cwd: __dirname,
		detached: true,
		stdio: ['ignore', out, err]
	});

	child.unref();
};