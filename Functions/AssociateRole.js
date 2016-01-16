module.exports =
{
	associateRole:associateRole,
	amendRoles:amendRoles,
	writeRoles:writeRoles,
	fulfilRoleAssociationForMembers:fulfilRoleAssociationForMembers
};

var FileSystem = require('fs');
var Request = require('request');
var DiscordUtilities = require('./DiscordUtilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');
var Utilities = require('./Utilities');

function associateRole(message)
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
			var discordRoleName = commandArguments.string1;
			var enjinTagName = commandArguments.string2;
			var discordRole = this.bot.servers[0].roles.get('name', discordRoleName);
			if (discordRole)
			{
				var enjinRequest = EnjinRequestTemplates.getSiteTags;
				enjinRequest.params.api_key = this.settings.enjin.api_key;
				Utilities.conductEnjinRequest.call(this, enjinRequest, 'associateRole', false, function(dataJSON, error)
				{
					if (error)
					{
						this.bot.reply(message, 'Sorry, an unexpected ' + error.source + ' error occurred.');
					}
					else
					{
						var enjinTagID = null;
						for (var keyEnjinTagID in dataJSON.result)
						{
							if (dataJSON.result[keyEnjinTagID].tagname === enjinTagName)
							{
								enjinTagID = keyEnjinTagID;
								break;
							};
						};
						if (enjinTagID)
						{
							FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
							{
								if (error)
								{
									if (error.errno === -4058)
									{
										writeRoles.call(this, discordRole, enjinTagID, message);
									}
									else
									{
										console.log('Unknown file error attempting to read roleAssociations.json.');
									};
								}
								else
								{
									amendRoles.call(this, discordRole, enjinTagID, data, message);
								};
							}).bind(this));
						}
						else
						{
							this.bot.reply(message, enjinTagName + ' does not exist in Enjin.');
						};
					};
				});
			}
			else
			{
				this.bot.reply(message, discordRoleName + ' does not exist in Discord.');
			};
		};
	}
	else
	{
		this.bot.reply(message, 'No can do! You lack authorisation.');
	};
};

function amendRoles(discordRole, enjinTagID, data, message)
{
	var roleAssociations = JSON.parse(data);
	var unique = true;
	for (var i = 0; i < roleAssociations.length; i++)
	{
		if (roleAssociations[i].discordRoleID === discordRole.id && roleAssociations[i].enjinTagID === enjinTagID)
		{
			unique = false;
		};
	};
	if (unique)
	{
		roleAssociations.push({'discordRoleID': discordRole.id, 'enjinTagID': enjinTagID});
		FileSystem.writeFile(global.appPath('Data/roleAssociations.json'), JSON.stringify(roleAssociations), 'utf8', (function(error)
		{
			if (error)
			{
				this.bot.reply(message, 'Roles not associated. Unexpected error.');
			}
			else
			{
				this.bot.reply(message, 'Roles successfully associated.');
				fulfilRoleAssociationForMembers.call(this, enjinTagID, discordRole);
			};
		}).bind(this));
	}
	else
	{
		this.bot.reply(message, 'These roles are already associated.');
	};
};

function writeRoles(discordRole, enjinTagID, message)
{
	var roleAssociations = [{'discordRoleID': discordRole.id, 'enjinTagID': enjinTagID}];
	FileSystem.writeFile(global.appPath('Data/roleAssociations.json'), JSON.stringify(roleAssociations), 'utf8', (function(error)
	{
		if (error)
		{
			this.bot.reply(message, 'Roles not associated. Unexpected error.');
		}
		else
		{
			this.bot.reply(message, 'Roles successfully associated.');
			fulfilRoleAssociationForMembers.call(this, enjinTagID, discordRole);
		};
	}).bind(this));
};

function fulfilRoleAssociationForMembers(enjinTagID, discordRole)
{
	var enjinRequest = EnjinRequestTemplates.getTagUsers;
	enjinRequest.params.api_key = this.settings.enjin.api_key;
	enjinRequest.params.tag_id = enjinTagID;
	Utilities.conductEnjinRequest.call(this, enjinRequest, 'fulfilRoleAssociationForMembers', true, function(dataJSON, error)
	{
		var enjinTagUsers = dataJSON.result;
		FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
		{
			var memberAssociations = JSON.parse(data);
			for (var memberAssociationIndex = 0; memberAssociationIndex < memberAssociations.length; memberAssociationIndex++)
			{
				var memberAssociation = memberAssociations[memberAssociationIndex];
				if (enjinTagUsers[memberAssociation.enjinUserID])
				{
					var discordUser = this.bot.servers[0].members.get('id', memberAssociations[memberAssociationIndex].discordMemberID);
					this.bot.addMemberToRoles(discordUser, [discordRole], function(error)
					{
						if (error)
						{
							Utilities.logError('fulfilRoleAssociationForMembers', 'Unexpected addMemberToRoles error.\n' + error);
						};
					});
				};
			};
		}).bind(this));
	});
};