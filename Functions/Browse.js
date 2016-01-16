module.exports =
{
	handleRequest:handleRequest,
	getMemberAssociations:getMemberAssociations,
	getRoleAssociations:getRoleAssociations,
	getLink:getLink
};

var FileSystem = require('fs');
var Request = require('request');
var Utilities = require('./Utilities');
var DiscordUtilities = require('./DiscordUtilities');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');

function handleRequest(request, response)
{
	switch(request.body.command)
	{
		case 'getMemberAssociations':
			getMemberAssociations.call(this, response);
			break;
		case 'getRoleAssociations':
			getRoleAssociations.call(this, response);
			break;
		default:
			response.send(JSON.stringify({error: 'Unrecognised command.'}));
	};
};

function getMemberAssociations(response)
{
	FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
	{
		if (error)
		{
			if (error.errno === -4058)
			{
				// No userAssociations.json
			}
			else
			{
				console.log('Unexpected file error read userAssociations.json.\n' + error);
			};
		}
		else
		{
			var output = [];
			var memberAssociations = JSON.parse(data);
			enjinRequest = EnjinRequestTemplates.getAllUsers;
			enjinRequest.params.api_key = this.settings.enjin.api_key;
			Utilities.conductEnjinRequest.call(this, enjinRequest, true, 'getMemberAssociations', function(dataJSON)
			{
				var enjinUsers = dataJSON.result;
				for (var memberAssociationIndex = 0; memberAssociationIndex < memberAssociations.length; memberAssociationIndex++)
				{
					var memberAssociation = memberAssociations[memberAssociationIndex];
					var discordUsername = this.bot.servers[0].members.get('id', memberAssociation.discordMemberID).username;
					var enjinUser = enjinUsers[memberAssociation.enjinUserID];
					var enjinUsername = enjinUser.username;
					output.push({discordMemberID: memberAssociation.discordMemberID, discordUsername: discordUsername, enjinUserID: memberAssociation.enjinUserID, enjinUsername: enjinUsername});
				};
				response.send(JSON.stringify(output));
			});
		};
	}).bind(this));
};

function getRoleAssociations(response)
{
	FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
	{
		if (error)
		{
			if (error.errno === -4058)
			{
				// No roleAssociations.json
			}
			else
			{
				console.log('Unexpected file error read roleAssociations.json.\n' + error);
			};
		}
		else
		{
			var output = [];
			var roleAssociations = JSON.parse(data);
			enjinRequest = EnjinRequestTemplates.getSiteTags;
			enjinRequest.params.api_key = this.settings.enjin.api_key;
			Utilities.conductEnjinRequest.call(this, enjinRequest, 'getRoleAssociations', true, function(dataJSON, error)
			{
				var enjinTags = dataJSON.result;
				for (var roleAssociationIndex = 0; roleAssociationIndex < roleAssociations.length; roleAssociationIndex++)
				{
					var roleAssociation = roleAssociations[roleAssociationIndex];
					var discordRoleName = this.bot.servers[0].roles.get('id', roleAssociation.discordRoleID).name;
					var enjinTag = enjinTags[roleAssociation.enjinTagID];
					var enjinTagName = enjinTag.tagname;
					output.push({discordRoleID: roleAssociation.discordRoleID, discordRoleName: discordRoleName, enjinTagID: roleAssociation.enjinTagID, enjinTagName: enjinTagName});
				};
				response.send(JSON.stringify(output));
			});
		};
	}).bind(this));
};

function getLink(message)
{
	this.bot.reply(message, 'I would send you a link, if I had one.');
};