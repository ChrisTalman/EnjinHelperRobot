module.exports =
{
	disassociateMember:disassociateMember
};

var FileSystem = require('fs');
var Request = require('request');
var DiscordUtilities = require('./DiscordUtilities');
var Utilities = require('./Utilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');

function disassociateMember(message)
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
			var discordUsername = commandArgument.string;
			var discordUser = this.bot.servers[0].members.get('name', discordUsername);
			var discordUserID = discordUser.id;
			FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
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
					var memberAssociations = JSON.parse(data);
					var disassociatedEnjinUserID = null;
					for (var memberAssociationIndex = 0; memberAssociationIndex < memberAssociations.length; memberAssociationIndex++)
					{
						var memberAssociation = memberAssociations[memberAssociationIndex];
						if (memberAssociation.discordMemberID === discordUserID)
						{
							disassociatedEnjinUserID = memberAssociation.enjinUserID;
							memberAssociations.splice(memberAssociationIndex, 1);
							break;
						};
					};
					FileSystem.writeFile(global.appPath('Data/userAssociations.json'), JSON.stringify(memberAssociations), 'utf8', (function(error)
					{
						if (error)
						{
							this.bot.reply(message, 'Unexpected file error.');
						}
						else
						{
							this.bot.reply(message, discordUser.username + ' association removed.');
							revokeDissacoiatedRoles.call(this, discordUser, disassociatedEnjinUserID);
						};
					}).bind(this));
				};
			}).bind(this));
		};
	}
	else
	{
		this.bot.reply(message, 'You can do! You lack authorisation.');
	};
};

function revokeDissacoiatedRoles(discordUser, disassociatedEnjinUserID)
{
	var enjinRequest = EnjinRequestTemplates.getUserTags;
	enjinRequest.params.api_key = this.settings.enjin.api_key;
	enjinRequest.params.user_id = disassociatedEnjinUserID;
	Request.post({url: this.settings.enjin.api_url, json: enjinRequest}, (function(error, httpResponse, dataJSON)
	{
		var enjinUserTags = dataJSON.result;
		FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
		{
			if (error)
			{
				if (error.errno === -4058)
				{
					// File does not exist
				}
				else
				{
					// Unexpected file error
				};
			}
			else
			{
				var roleAssociations = JSON.parse(data);
				var discordRolesToRemove = [];
				for (var roleAssociationIndex = 0; roleAssociationIndex < roleAssociations.length; roleAssociationIndex++)
				{
					var roleAssociation = roleAssociations[roleAssociationIndex];
					if (enjinUserTags[roleAssociation.enjinTagID])
					{
						discordRolesToRemove.push(this.bot.servers[0].roles.get('id', roleAssociation.discordRoleID));
					};
				};
				if (discordRolesToRemove.length > 0)
				{
					this.bot.removeMemberFromRoles(discordUser, discordRolesToRemove, function(error)
					{
						if (error)
						{
							// Unexpected remove roles error
						};
					});
				};
			};
		}).bind(this));
	}).bind(this));
};