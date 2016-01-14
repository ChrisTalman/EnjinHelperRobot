module.exports =
{
	handleVoiceJoin:handleVoiceJoin,
	handleVoiceLeave:handleVoiceLeave,
	handlePresence:handlePresence
};

function handleVoiceJoin(User, VoiceChannel)
{
	var message = '**' + User.username + '** has joined **' + VoiceChannel.name + '**.';
	var activityChannel = this.bot.servers.get('name', this.settings.discord.serverName).channels.get('name', 'activity');
	this.bot.sendMessage(activityChannel, message);
};

function handleVoiceLeave(User, VoiceChannel)
{

};

function handlePresence(User, status, gameID)
{
	var activityChannel = this.bot.servers.get('name', this.settings.discord.serverName).channels.get('name', 'activity');
	switch(status)
	{
		case 'online':
			var message = '**' + User.username + '** is now online.';
			this.bot.sendMessage(activityChannel, message);
			break;
		case 'offline':
			var message = '**' + User.username + '** is now offline.';
			this.bot.sendMessage(activityChannel, message);
			break;
		default:
			//console.log('User: ' + User.username + '. Status: ' + status + '. Game ID: ' + gameID + '.');
	};
};