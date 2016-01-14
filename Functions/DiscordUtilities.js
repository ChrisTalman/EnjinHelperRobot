module.exports =
{
	isMemberAuthorised:isMemberAuthorised,
	guestify:guestify
};

var FileSystem = require('fs');
var Utilities = require('../Functions/Utilities');

function isMemberAuthorised(member)
{
	var memberRoles = this.bot.servers[0].rolesOfUser(member);
	var authorised = false;
	for (var i = 0; i < memberRoles.length; i++)
	{
		if (this.settings.discord.authorisedRoles.indexOf(memberRoles[i].name) > -1)
		{
			authorised = true;
			break;
		};
	};
	return authorised;
};

function isGuestifyAuthorised(member)
{
	var memberRoles = this.bot.servers[0].rolesOfUser(member);
	var authorised = false;
	for (var i = 0; i < memberRoles.length; i++)
	{
		if (this.settings.discord.guestifyAuthorisedRoles.indexOf(memberRoles[i].name) > -1)
		{
			authorised = true;
			break;
		};
	};
	return authorised;
};

function guestify(message)
{
	if (isGuestifyAuthorised.call(this, message.author))
	{
		var commandArgument = Utilities.getCommandArgument(message.content);
		if (commandArgument.error)
		{
			this.bot.reply(message, 'Your command syntax is invalid.');
		}
		else
		{
			var discordUsername = commandArgument.string;
			var discordUser = this.bot.servers[0].members.get('name', discordUsername);
			if (discordUser)
			{
				if (this.bot.servers[0].rolesOfUser(discordUser).length === 0)
				{
					FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
					{
						var associated = false;
						var fileError = false;
						if (error)
						{
							if (error.errno !== -4058)
							{
								console.log('Unknown file error attempting to read userAssociations.json.');
								fileError = true;
							};
						}
						else
						{
							var members = JSON.parse(data);
							associated = members.some(function(currentValue)
							{
								if (currentValue.discordMemberID === discordUser.id)
								{
									return true;
								};
							});
						};
						if (associated)
						{
							this.bot.reply(message, discordUser.username + ' already associated.');
						}
						else if (fileError)
						{
							this.bot.reply(message, discordUser.username + 'could not be guestified. Unexpected file error.');
						}
						else
						{
							var guestifyRole = this.bot.servers[0].roles.get('name', this.settings.discord.guestifyRole);
							this.bot.addMemberToRoles(discordUser, [guestifyRole], (function(error)
							{
								if (error)
								{
									console.log('Unexpected error attempting to add guestify role.\n' + error);
									this.bot.reply(message, 'Unexpected error attempting to add guestify role.');
								}
								else
								{
									this.bot.reply(message, discordUser.name + ' has been guestified.');
									this.bot.sendMessage(discordUser, 'Hey! You have been given guest permissions. You should now be able to move between channels.');
								};
							}).bind(this));
						};
					}).bind(this));
				}
				else
				{
					this.bot.reply(message, discordUser.username + ' already has roles.');
				};
			}
			else
			{
				this.bot.reply(message, discordUsername + ' does not exist.');
			};
		};
	}
	else
	{
		this.bot.reply(message, 'No can do! You lack authorisation.');
	};
};