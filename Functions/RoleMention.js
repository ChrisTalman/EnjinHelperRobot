module.exports = handleRoleMention;

function handleRoleMention(message)
{
	var roleMentionExpression = /@([\w]+)/;
	var roleMentionMatched = message.content.match(roleMentionExpression);
	if (roleMentionMatched)
	{
		var discordRoleName = roleMentionMatched[1];
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
			this.bot.sendMessage(message.channel, mentionMessage);
		};
	};
};