module.exports =
{
	getCommandArgument:getCommandArgument,
	getCommandArguments:getCommandArguments,
	clearAllDuplicateRolesFromMembers:clearAllDuplicateRolesFromMembers,
	conductEnjinRequest:conductEnjinRequest,
	logError:logError
};

var Request = require('request');

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

function conductEnjinRequest(enjinRequest, functionName, automaticErrorHandling, callback)
{
	Request.post({url: this.settings.enjin.api_url, json: enjinRequest}, (function(error, httpResponse, dataJSON)
	{
		if (error)
		{
			logError(functionName, 'Unexpected Enjin API request error.\n' + error);
			if (!automaticErrorHandling)
			{
				callback.call(this, dataJSON, {source: 'Request'});
			};
		}
		else
		{
			if (dataJSON.result)
			{
				callback.call(this, dataJSON);
			}
			else
			{
				logError(functionName, 'Unexpected Enjin API response.\n' + dataJSON);
				if (!automaticErrorHandling)
				{
					callback.call(this, dataJSON, {source: 'Enjin'});
				};
			};
		};
	}).bind(this));
};

function logError(functionName, errorSummary)
{
	var timestamp = Date.now();
	var date = new Date(timestamp);
	var seconds = date.getSeconds();
	var minutes = date.getMinutes();
	var hours = date.getHours();
	var error = '[' + getTwoDigits(hours) + ':' + getTwoDigits(minutes) + ':' + getTwoDigits(seconds) + '] ' + functionName + ': ' + errorSummary;
	console.log(error);
};

function getTwoDigits(number)
{
	return ('0' + number).slice(-2);
};