module.exports =
{
	updateMember:updateMember,
	fulfilRoles:fulfilRoles
};

var FileSystem = require('fs');
var Request = require('request');
var DiscordUtilities = require('./DiscordUtilities');
var Utilities = require('./Utilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');

function updateMember(message)
{
	var commandArgument = Utilities.getCommandArgument(message.content);
	if (commandArgument.error)
	{
		this.bot.reply(message, 'Your command syntax is invalid.');
	}
	else
	{
		var discordUsername = commandArgument.string;
		var discordUser = this.bot.servers[0].members.get('username', discordUsername);
		fulfilRoles.call(this, discordUser, handleMemberUpdated, [message, discordUser]);
	};
};

function handleMemberUpdated(message, discordUser)
{
	this.bot.reply(message, discordUser.username + ' updated successfully.');
};

function fulfilRoles(discordUser, callback, callbackArguments)
{
	FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
	{
		if (error)
		{
			console.log('Unexpected error attempting to read userAssociations.json (' + error.errno + ').');
		}
		else
		{
			var memberAssociations = JSON.parse(data);
			var enjinUserID = null;
			for (var memberIndex = 0; memberIndex < memberAssociations.length; memberIndex++)
			{
				var memberAssociation = memberAssociations[memberIndex];
				if (memberAssociation.discordMemberID === discordUser.id)
				{
					enjinUserID = memberAssociation.enjinUserID;
					break;
				};
			};
			if (enjinUserID)
			{
				FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
				{
					if (error)
					{
						console.log('Unexpected error attempting to read roleAssociations.json (' + error.errno + ').');
					}
					else
					{
						var roleAssociations = JSON.parse(data);
						var enjinRequest = EnjinRequestTemplates.getUserTags;
						enjinRequest.params.api_key = this.settings.enjin.api_key;
						enjinRequest.params.user_id = enjinUserID;
						Request.post({url: this.settings.enjin.api_url, json: enjinRequest}, (function(error, httpResponse, dataJSON)
						{
							var discordUserRoles = this.bot.servers[0].rolesOfUser(discordUser);
							var enjinUserTags = dataJSON.result;
							var discordRolesToAdd = [];
							var discordRolesToRemove = [];
							for (var roleAssociationIndex = 0; roleAssociationIndex < roleAssociations.length; roleAssociationIndex++)
							{
								var roleAssociation = roleAssociations[roleAssociationIndex];
								var discordRole = this.bot.servers[0].roles.get('id', roleAssociation.discordRoleID);
								if (enjinUserTags[roleAssociation.enjinTagID])
								{
									discordRolesToAdd.push(discordRole);
								}
								else
								{
									var discordUserHasUnauthorisedRole = discordUserRoles.some(function(currentValue)
									{
										if (currentValue.id === roleAssociation.discordRoleID)
										{
											return true;
										};
									});
									if (discordUserHasUnauthorisedRole)
									{
										discordRolesToRemove.push(discordRole);
									};
								};
							};
							this.bot.addMemberToRoles(discordUser, discordRolesToAdd, (function(error)
							{
								if (error && discordRolesToAdd.length > 0)
								{
									console.log('Unexpected error attempting to add roles.\n' + error);
								}
								else
								{
									this.bot.removeMemberFromRoles(discordUser, discordRolesToRemove, (function(error)
									{
										if (error && discordRolesToRemove.length > 0)
										{
											console.log('Unexpected error attempting to remove roles.\n' + error);
										}
										else
										{
											if (callback)
											{
												callback.apply(this, callbackArguments);
											};
										};
									}).bind(this));
								};
							}).bind(this));
						}).bind(this));
					};
				}).bind(this));
			}
			else
			{
				// No user association found
			};
		};
	}).bind(this));
};