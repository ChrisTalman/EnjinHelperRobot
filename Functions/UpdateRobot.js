module.exports = updateRobot;

var DiscordUtilities = require('./DiscordUtilities');

function updateRobot()
{
	if (DiscordUtilities.isMemberAuthorised.call(this, message.author))
	{
		spawnUpdater();
		process.exit();
	}
	else
	{
		this.bot.reply(message, 'No can do! You lack authorisation.');
	};
};

function spawnUpdater()
{
	const fs = require('fs');
	const spawn = require('child_process').spawn;
	const out = fs.openSync(global.appPath('Data/updateOutput.txt'), 'a');
	const err = fs.openSync(global.appPath('Data/updateErrors.txt'), 'a');

	const child = spawn('/bin/bash', ['test.sh'], {
		cwd: __dirname,
		detached: true,
		stdio: ['ignore', out, err]
	});

	child.unref();
};