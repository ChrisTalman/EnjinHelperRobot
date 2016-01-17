module.exports = handleRoleMention;

function handleRoleMention(message)
{
	var roleMentionExpression = /@([^@]+)/g;
	var roleMentionMatches = message.content.match(roleMentionExpression);
	if (roleMentionMatches)
	{
		var server = this.bot.servers.get('name', this.settings.discord.serverName);
		var mentionedDiscordRoles = [];
		for (var matchIndex = 0; matchIndex < roleMentionMatches.length; matchIndex++)
		{
			var match = roleMentionMatches[matchIndex];
			var matchRoleName = match.slice(1);
			var matchSpaceIndex = match.indexOf(' ');
			if (matchSpaceIndex > -1)
			{
				matchRoleName = match.slice(1, matchSpaceIndex);
			};
			var discordRole = server.roles.get('name', matchRoleName);
			if (discordRole)
			{
				mentionedDiscordRoles.push(discordRole);
			};
		};
		if (mentionedDiscordRoles.length > 0)
		{
			var mentionedDiscordRoleNames = mentionedDiscordRoles.map(function(currentValue)
			{
				return currentValue.name;
			});
			var membersWithRole = [];
			for (var memberIndex = 0; memberIndex < server.members.length; memberIndex++)
			{
				var member = server.members[memberIndex];
				var memberHasRole = this.bot.servers[0].rolesOfUser(member).some((function(currentValue)
				{
					if (this.mentionedDiscordRoleNames.indexOf(currentValue.name) > -1)
					{
						return true;
					};
				}), {mentionedDiscordRoleNames: mentionedDiscordRoleNames});
				if (memberHasRole)
				{
					var memberAlreadyMentioned = membersWithRole.some((function(currentValue)
					{
						if (currentValue.id === this.member.id)
						{
							return true;
						};
					}), {member: member});
					if (!memberAlreadyMentioned)
					{
						membersWithRole.push(member);
					};
				};
			};
			var memberMentions = membersWithRole.map(function(currentValue)
			{
				return currentValue;
			});
			memberMentions = memberMentions.join(' ');
			var mentionMessage = '*' + message.author.username + '* said: **' + message.content + '** ' + memberMentions;
			//var mentionMessage = '**See previous message by ' + message.author + '**. ' + memberMentions;
			this.bot.sendMessage(message.channel, mentionMessage, function(error)
			{
				if (error)
				{
					logError('handleRoleMention', 'Unexpected sendMessage error.\n' + error);
				};
			});
			this.bot.deleteMessage(message, function(error)
			{
				if (error)
				{
					logError('handleRoleMention', 'Unexpected deleteMessage error.\n' + error);
				};
			});
		};
		/*var discordRoleName = roleMentionMatched[1];
		var discordRole = this.bot.servers[0].roles.get('name', discordRoleName);
		if (discordRole)
		{
			var members = this.bot.servers[0].members;
			var membersWithRole = [];
			for (var memberIndex = 0; memberIndex < members.length; memberIndex++)
			{
				var member = members[memberIndex];
				var memberHasRole = this.bot.servers[0].rolesOfUser(member).some((function(currentValue)
				{
					if (currentValue.name === this.discordRoleName)
					{
						return true;
					};
				}), {discordRoleName: discordRoleName});
				if (memberHasRole)
				{
					membersWithRole.push(member);
				};
			};
			var memberMentions = membersWithRole.map(function(currentValue)
			{
				return currentValue;
			});
			memberMentions = memberMentions.join(' ');
			var mentionMessage = '**See previous message by ' + message.author + '**. ' + memberMentions;
			this.bot.sendMessage(message.channel, mentionMessage, function(error)
			{
				if (error)
				{
					logError('handleRoleMention', 'Unexpected sendMessage error.\n' + error);
				};
			});
		};*/
	};
};