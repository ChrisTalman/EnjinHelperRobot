module.exports = DiscordMonitor;

var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');
var FileSystem = require('fs');
var Request = require('request');
var Enroll = require('../Functions/Enroll');
var Utilities = require('../Functions/Utilities');

function DiscordMonitor(robot, settings, conversationsManager)
{
	var memberRecords = {};
	var activityChannel = null;
	initialise();
	// Public
	// Private
	function initialise()
	{
		robot.on('ready', initialiseMemberRecords)
		robot.on('serverNewMember', handleNewMember);
		robot.on('serverMemberUpdated', handleMemberUpdated);
		robot.on('presence', handlePresence);
		robot.on('voiceJoin', handleVoiceJoin);
		robot.on('voiceLeave', handleVoiceLeave);
	};
	function initialiseMemberRecords()
	{
		activityChannel = robot.servers.get('name', settings.discord.serverName).channels.get('name', 'activity');
		var members = robot.servers.get('name', settings.discord.serverName).members;
		for (var memberIndex = 0; memberIndex < members.length; memberIndex++)
		{
			var member = members[memberIndex];
			initialiseMemberRecord(member);
		};
	};
	function initialiseMemberRecord(discordUser)
	{
		var memberRecord = memberRecords[discordUser.id] = {};
		memberRecord = memberRecords[discordUser.id];
		if (discordUser.voiceChannel)
		{
			memberRecord.lastVoiceChannelID = discordUser.voiceChannel.id;
		};
		memberRecord.lastStatus = discordUser.status;
		memberRecord.lastRoles = getRolesArrayAsIDs(robot.servers[0].memberMap[discordUser.id].roles);
	};
	function getRolesArrayAsIDs(roles)
	{
		var idArray = [];
		for (var roleIndex = 0; roleIndex < roles.length; roleIndex++)
		{
			idArray.push(roles[roleIndex].id);
		};
		return idArray;
	};
	function handleNewMember(discordServer, discordUser)
	{
		initialiseMemberRecord(discordUser);
	};
	function handleMemberUpdated(discordServer, discordUser)
	{
		var memberRecord = memberRecords[discordUser.id];
		var lastRoles = memberRecord.lastRoles;
		var currentRoles = discordServer.memberMap[discordUser.id].roles;
		for (var roleIndex = 0; roleIndex < lastRoles.length; roleIndex++)
		{
			var roleID = lastRoles[roleIndex];
			var roleRemains = currentRoles.some(function(currentValue)
			{
				if (currentValue.id === roleID)
				{
					return true;
				};
			});
			if (!roleRemains)
			{
				var discordRole = discordServer.roles.get('id', roleID);
				if (discordRole)
				{
					console.log(discordUser.username + ' removed from ' + discordRole.name + '.');
					handleRoleChange(discordServer, discordUser, discordRole, false);
				}
				else
				{
					console.log(discordUser.username + ' removed from a deleted role.');
				};
			};
		};
		for (var roleIndex = 0; roleIndex < currentRoles.length; roleIndex++)
		{
			var roleID = currentRoles[roleIndex].id;
			var roleOld = lastRoles.some(function(currentValue)
			{
				if (currentValue === roleID)
				{
					return true;
				};
			});
			if (!roleOld)
			{
				var discordRole = discordServer.roles.get('id', roleID);
				console.log(discordUser.username + ' added to ' + discordRole.name + '.');
				handleRoleChange(discordServer, discordUser, discordRole, true);
			};
		};
		memberRecord.lastRoles = getRolesArrayAsIDs(robot.servers[0].memberMap[discordUser.id].roles);
	};
	function handleRoleChange(discordServer, discordUser, discordRole, added)
	{
		FileSystem.readFile(global.appPath('Data/roleAssociations.json'), 'utf8', (function(error, data)
		{
			if (error)
			{
				if (error.errno !== -4058)
				{
					console.log('Unexpected error attempting to read roleAssociations.json.\n' + error);
				};
			}
			else
			{
				var roles = JSON.parse(data);
				var roleAssociation = null;
				for (var roleIndex = 0; roleIndex < roles.length; roleIndex++)
				{
					if (roles[roleIndex].discordRoleID === discordRole.id)
					{
						roleAssociation = roles[roleIndex];
						break;
					};
				};
				if (roleAssociation)
				{
					FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
					{
						if (error)
						{
							if (error.errno !== -4058)
							{
								console.log('Unexpected error attempting to read userAssociations.json.\n' + error);
							};
						}
						else
						{
							var members = JSON.parse(data);
							var memberAssociation = null;
							for (var memberIndex = 0; memberIndex < members.length; memberIndex++)
							{
								if (members[memberIndex].discordMemberID === discordUser.id)
								{
									memberAssociation = members[memberIndex];
									break;
								};
							};
							if (memberAssociation)
							{
								var enjinUserID = memberAssociation.enjinUserID;
								var enjinTagID = roleAssociation.enjinTagID;
								var enjinRequest = null;
								if (added)
								{
									enjinRequest = EnjinRequestTemplates.tagUser;
								}
								else
								{
									enjinRequest = EnjinRequestTemplates.untagUser;
								};
								enjinRequest.params.api_key = settings.enjin.api_key;
								enjinRequest.params.user_id = enjinUserID;
								enjinRequest.params.tag_id = enjinTagID;
								Utilities.conductEnjinRequest.call({settings:settings}, enjinRequest, 'handleRoleChange', true, function(dataJSON, error)
								{
									if (dataJSON.result === true)
									{
										var addedText = '';
										if (added)
										{
											addedText = 'added to';
										}
										else
										{
											addedText = 'removed from';
										};
										var message = '**' + discordUser.username + '** ' + addedText + ' role **' + discordRole.name + '** and associated Enjin tag.';
										//console.log(message);
										robot.sendMessage(activityChannel, message);
									}
									else
									{
										Utilities.logError('handleRoleChange', 'Enjin API failed to add or remove tag from user.\n' + dataJSON);
									};
								});
							}
							else
							{
								//console.log(discordUser.name + ' unassociated. Ignored.');
							};
						};
					}));
				}
				else
				{
					//console.log(discordRole.name + ' unassociated. Ignored.');
				};
			};
		}));
	};
	function handlePresence(discordUser, status, gameID)
	{
		var memberRecord = memberRecords[discordUser.id];
		if (status === 'online' && (!memberRecord || memberRecord.lastStatus === 'offline'))
		{
			var message = '**' + discordUser.username + '** is now online.';
			robot.sendMessage(activityChannel, message);
			// Currently only contacts those without a member record, which is very few users
			if (!memberRecord)
			{
				Enroll.startConversation.call({bot: robot, conversationsManager: conversationsManager}, 'start', members.get('name', 'Bluecewe | Xterea'), null);
			};
		}
		else if (status === 'offline')
		{
			var message = '**' + discordUser.username + '** is now offline.';
			robot.sendMessage(activityChannel, message);
			if (conversationsManager.userConversing(discordUser.id))
			{
				conversationsManager.endConversation(discordUser.id);
			};
		};
		if (memberRecord)
		{
			memberRecord.lastStatus = status;
		};
	};
	function handleVoiceJoin(discordUser, voiceChannel)
	{
		var memberRecord = memberRecords[discordUser.id];
		if (!memberRecord || !memberRecord.lastVoiceChannelID || memberRecord.lastVoiceChannelID !== voiceChannel.id)
		{
			var message = '**' + discordUser.username + '** joined **' + voiceChannel.name + '**.';
			if (memberRecord.lastVoiceChannelID)
			{
				var lastVoiceChannel = voiceChannel.server.channels.get('id', memberRecord.lastVoiceChannelID);
				if (lastVoiceChannel)
				{
					message = '**' + discordUser.username + '** switched from **' + lastVoiceChannel.name + '** to **' + voiceChannel.name + '**.';
				};
			};
			robot.sendMessage(activityChannel, message);
		};
		memberRecord.lastVoiceChannelID = discordUser.voiceChannel.id;
	};
	function handleVoiceLeave(discordUser, voiceChannel)
	{
		var memberRecord = memberRecords[discordUser.id];
		if (!discordUser.voiceChannel)
		{
			var message = '**' + discordUser.username + '** left **' + voiceChannel.name + '**.';
			robot.sendMessage(activityChannel, message);
			if (memberRecord)
			{
				memberRecord.lastVoiceChannelID = null;
			};
		};
	};
};