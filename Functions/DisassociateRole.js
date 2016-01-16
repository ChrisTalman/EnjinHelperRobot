module.exports =
{
	disassociateRole:disassociateRole
};

var FileSystem = require('fs');
var Request = require('request');
var DiscordUtilities = require('./DiscordUtilities');
var Utilities = require('./Utilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');

function disassociateRole(message)
{
	if (DiscordUtilities.isMemberAuthorised.call(this, message.author))
	{
		var commandArgument = Utilities.getCommandArgument(message.content);
		if (commandArgument.error)
		{
			this.bot.reply(message, 'Your command syntax is invalid.');
		}
		else
		{
			var discordRoleName = commandArgument.string;
			var discordRole = this.bot.servers[0].roles.get('name', discordRoleName);
			discordRoleID = discordRole.id;
			FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
			{
				if (error)
				{
					if (error.errno === -4058)
					{
						this.bot.reply(message, 'There are no associations to disassociate.');
					}
					else
					{
						this.bot.reply(message, 'Unexpected file error.');
					};
				}
				else
				{
					var roleAssociations = JSON.parse(data);
					var disassociatedEnjinTagID = null;
					for (var roleAssociationIndex = 0; roleAssociationIndex < roleAssociations.length; roleAssociationIndex++)
					{
						var roleAssociation = roleAssociations[roleAssociationIndex];
						if (roleAssociation.discordRoleID === discordRoleID)
						{
							disassociatedEnjinTagID = roleAssociation.enjinTagID;
							roleAssociations.splice(roleAssociationIndex, 1);
							break;
						};
					};
					FileSystem.writeFile(global.appPath('Data/roleAssociations.json'), JSON.stringify(roleAssociations), 'utf8', (function(error)
					{
						if (error)
						{
							this.bot.reply(message, 'Unexpected file error.');
						}
						else
						{
							this.bot.reply(message, discordRole.name + ' association removed.');
							revokeDissacoiatedRole.call(this, disassociatedEnjinTagID, discordRole);
						};
					}).bind(this));
				};
			}).bind(this));
		};
	}
	else
	{
		this.bot.reply(message, 'No can do! You lack authorisation.');
	};
};

function revokeDissacoiatedRole(disassociatedEnjinTagID, discordRole)
{
	var enjinRequest = EnjinRequestTemplates.getTagUsers;
	enjinRequest.params.api_key = this.settings.enjin.api_key;
	enjinRequest.params.tag_id = disassociatedEnjinTagID;
	Utilities.conductEnjinRequest.call(this, enjinRequest, 'revokeDissacoiatedRole', true, function(dataJSON, error)
	{
		var enjinTagUsers = dataJSON.result;
		FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
		{
			if (error)
			{
				if (error.errno === -4058)
				{
					// File does not exist
					console.log('userAssociations.json does not exist.');
				}
				else
				{
					// Unexpected file error
					console.log('Unexpected file error.');
				};
			}
			else
			{
				var memberAssociations = JSON.parse(data);
				for (var memberAssociationIndex = 0; memberAssociationIndex < memberAssociations.length; memberAssociationIndex++)
				{
					var memberAssociation = memberAssociations[memberAssociationIndex];
					if (enjinTagUsers[memberAssociation.enjinUserID])
					{
						var discordUser = this.bot.servers[0].members.get('id', memberAssociation.discordMemberID);
						console.log(discordUser.username + ' uses ' + discordRole.name + '.');
						this.bot.removeMemberFromRoles(discordUser, [discordRole], function(error)
						{
							if (error)
							{
								// Unexpected remove roles error
								console.log('Unexpected remove roles error.');
							};
						});
					};
				};
			};
		}).bind(this));
	});
};