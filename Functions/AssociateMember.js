module.exports =
{
	associateMember:associateMember,
	amendMembers:amendMembers,
	writeMembers:writeMembers
};

var FileSystem = require('fs');
var Request = require('request');
var DiscordUtilities = require('./DiscordUtilities');
var Utilities = require('./Utilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');
var UpdateMember = require('./UpdateMember');

function associateMember(message)
{
	if (DiscordUtilities.isMemberAuthorised.call(this, message.author))
	{
		var commandArguments = Utilities.getCommandArguments(message.content);
		if (commandArguments.error)
		{
			this.bot.reply(message, 'Your command syntax is invalid.');
		}
		else
		{
			var enjinUsername = commandArguments.string1;
			var discordUsername = commandArguments.string2;
			var enjinRequest = EnjinRequestTemplates.getAllUsers;
			enjinRequest.params.api_key = this.settings.enjin.api_key;
			Utilities.conductEnjinRequest.call(this, enjinRequest, false, 'associateMember', function(dataJSON, error)
			{
				if (error)
				{
					this.bot.reply(message, 'Sorry, an unexpected ' + error.source + ' error occurred.');
				}
				else
				{
					var enjinUserID = null;
					for (var keyEnjinUserID in dataJSON.result)
					{
						if (dataJSON.result[keyEnjinUserID].username === enjinUsername)
						{
							enjinUserID = keyEnjinUserID;
							break;
						};
					};
					if (enjinUserID)
					{
						var members = this.bot.servers[0].members;
						var discordMember = null;
						for (var i = 0; i < members.length; i++)
						{
							if (members[i].username === discordUsername)
							{
								discordMember = members[i];
								break;
							};
						};
						if (discordMember)
						{
							var enjinRequest = EnjinRequestTemplates.getUserTags;
							enjinRequest.params.api_key = this.settings.enjin.api_key;
							enjinRequest.params.user_id = enjinUserID;
							Utilities.conductEnjinRequest.call(this, enjinRequest, false, 'associateMember', function(dataJSON, error)
							{
								if (error)
								{
									this.bot.reply(message, 'Sorry, an unexpected ' + error.source + ' error occurred.');
								}
								else
								{
									FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
									{
										if (error)
										{
											if (error.errno === -4058)
											{
												writeMembers.call(this, enjinUserID, discordMember, message);
											}
											else
											{
												console.log('Unknown file error attempting to read userAssociations.json.');
											};
										}
										else
										{
											amendMembers.call(this, enjinUserID, discordMember, data, message);
										};
									}).bind(this));
								};
							});
						}
						else
						{
							this.bot.reply(message, discordUsername + ' does not exist in Discord.');
						};
					}
					else
					{
						this.bot.reply(message, enjinUsername + ' does not exist in Enjin.');
					};
				};
			});
		};
	}
	else
	{
		this.bot.reply(message, 'No can do! You lack authorisation.');
	};
};

function amendMembers(enjinUserID, discordUser, data, message)
{
	var discordMemberID = discordUser.id;
	var members = JSON.parse(data);
	var uniqueAssociation = true;
	var uniqueDiscordMember = true;
	for (var i = 0; i < members.length; i++)
	{
		if (members[i].enjinUserID === enjinUserID && members[i].discordMemberID === discordMemberID)
		{
			uniqueAssociation = false;
			break;
		}
		else if (members[i].discordMemberID === discordMemberID)
		{
			uniqueDiscordMember = false;
			break;
		};
	};
	if (uniqueAssociation && uniqueDiscordMember)
	{
		members.push({'enjinUserID': enjinUserID, 'discordMemberID': discordMemberID});
		FileSystem.writeFile(global.appPath('Data/userAssociations.json'), JSON.stringify(members), 'utf8', (function(error)
		{
			if (error)
			{
				this.bot.reply(message, discordUser.username + ' not associated. Unexpected file error.');
			}
			else
			{
				this.bot.reply(message, discordUser.username + ' successfully associated.');
				UpdateMember.fulfilRoles.call(this, this.bot.servers[0].members.get('id', discordMemberID));
			};
		}).bind(this));
	}
	if (!uniqueAssociation)
	{
		this.bot.reply(message, 'These accounts are already associated.');
	};
	if (!uniqueDiscordMember)
	{
		this.bot.reply(message, discordUser.username + ' already associated.');
	};
};

function writeMembers(enjinUserID, discordUser, message)
{
	var discordMemberID = discordUser.id;
	var members = [{'enjinUserID': enjinUserID, 'discordMemberID': discordMemberID}];
	FileSystem.writeFile(global.appPath('Data/userAssociations.json'), JSON.stringify(members), 'utf8', (function(error)
	{
		if (error)
		{
			this.bot.reply(message, discordUser.username +' not associated. Unexpected file error.');
		}
		else
		{
			this.bot.reply(message, discordUser.username + ' successfully associated.');
			UpdateMember.fulfilRoles.call(this, this.bot.servers[0].members.get('id', discordMemberID));
		};
	}).bind(this));
};