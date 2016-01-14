module.exports =
{
	getCommandArgument:getCommandArgument,
	getCommandArguments:getCommandArguments,
	clearAllDuplicateRolesFromMembers:clearAllDuplicateRolesFromMembers
};

function getCommandArgument(command)
{
	var commandExpression = /![\w]+ "([^"]+)"/;
	var commandMatched = command.match(commandExpression);
	if (commandMatched)
	{
		var string = commandMatched[1];
		return {string: string};
	}
	else
	{
		return {error: 'matchFailure'};
	};
};

function getCommandArguments(command)
{
	var commandExpression = /![\w]+ "([^"]+)" "([^"]+)"/;
	var commandMatched = command.match(commandExpression);
	if (commandMatched)
	{
		var string1 = commandMatched[1];
		var string2 = commandMatched[2];
		return {string1: string1, string2: string2};
	}
	else
	{
		return {error: 'matchFailure'};
	};
};

function clearAllDuplicateRolesFromMembers()
{
	var server = this.bot.servers[0];
	var members = server.members;
	for (var memberIndex = 0; memberIndex < members.length; memberIndex++)
	{
		var member = members[memberIndex];
		//console.log('Member: ' + member.id + '. Index: ' + memberIndex + '.');
		var memberRoles = server.memberMap[member.id].roles;
		var uniqueRoles = [];
		for (var roleIndex = 0; roleIndex < memberRoles.length; roleIndex++)
		{
			var memberRole = memberRoles[roleIndex];
			var roleIsDuplicate = uniqueRoles.some(function(currentValue)
			{
				if (currentValue.id === memberRole.id)
				{
					return true;
				};
			});
			if (!roleIsDuplicate)
			{
				uniqueRoles.push(memberRole);
			};
		};
		for (var i = 0; i < uniqueRoles.length; i++)
		{
			//console.log('Role: ' + server.roles.get('id', uniqueRoles[i].id).name + '.');
		};
		server.memberMap[member.id].roles = [];
		this.bot.addMemberToRoles(member, uniqueRoles);
	};
};