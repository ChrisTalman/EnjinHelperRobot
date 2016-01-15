module.exports =
{
	handleConversation:handleConversation,
	startConversation:startConversation,
	manualEnroll:manualEnroll
};

var FileSystem = require('fs');
var Request = require('request');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');
var AssociateMember = require('../Functions/AssociateMember');
var Utilities = require('../Functions/Utilities');

function manualEnroll(message)
{
	FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
	{
		var memberUnenrolled = true;
		var unexpectedError = false;
		if (error)
		{
			if (error.errno === -4058)
			{
				memberUnenrolled = true;
			}
			else
			{
				unexpectedError = true;
			};
		}
		else
		{
			var members = JSON.parse(data);
			for (var memberIndex = 0; memberIndex < members.length; memberIndex++)
			{
				if (members[memberIndex].discordMemberID === message.author.id)
				{
					memberUnenrolled = false;
					break;
				};
			};
		};
		if (memberUnenrolled)
		{
			startConversation.call(this, 'enjinUserIdentification', null, message);
		}
		else
		{
			if (unexpectedError)
			{
				this.bot.reply(message, 'Sorry, an unexpected file error occurred. Please try again.');
			}
			else
			{
				this.bot.reply(message, 'You are already enrolled.' /*Would you like to update your roles? Respond `yes` or `no`.'*/);
			};
		};
	}).bind(this));
};

function startConversation(stage, discordUser, message)
{
	var discordUserID = null;
	if (discordUser)
	{
		discordUserID = discordUser.id;
	}
	else
	{
		discordUserID = message.author.id;
	};
	this.conversationsManager.startConversation(discordUserID, 'unenrolledMember', stage);
	switch (stage)
	{
		case 'start':
			this.bot.sendMessage(discordUser, 'Hey! Would you like me to get your permissions for you? Respond `yes` or `no`.');
			break;
		case 'enjinUserIdentification':
			this.bot.reply(message, 'What is your Enjin username?');
			break;
	};
};

function handleConversation(conversation, message)
{
	console.log('Handling conversation for ' + this.bot.servers[0].members.get('id', conversation.discordUserID).username + '. Type: ' + conversation.type + '. Stage: ' + conversation.stage + '.');
	switch (conversation.stage)
	{
		case 'start':
			handleStart.call(this, conversation, message);
			break;
		case 'enjinUserIdentification':
			handleEnjinUserIdentification.call(this, conversation, message);
			break;
		case 'authenticationCode':
			handleAuthenticationCode.call(this, conversation, message);
			break;
	};
};

function handleStart(conversation, message)
{
	if (message.content.toLowerCase() === 'yes')
	{
		this.conversationsManager.setConversationStage(message.author.id, 'enjinUserIdentification');
		this.bot.reply(message, 'What is your Enjin username?');
	}
	else if (message.content.toLowerCase() === 'no')
	{
		this.conversationsManager.endConversation(message.author.id);
		this.bot.reply(message, 'Okay, if you want to get your roles in the future, message me `!enroll`. Have a nice day.');
	};
};

function handleEnjinUserIdentification(conversation, message)
{
	this.bot.reply(message, 'This may take a few moments, please wait...');
	var enjinUsername = message.content;
	var enjinRequest = EnjinRequestTemplates.getAllUsers;
	enjinRequest.params.api_key = this.settings.enjin.api_key;
	Utilities.conductEnjinRequest.call(this, enjinRequest, false, 'handleEnjinUserIdentification', function(dataJSON, error)
	{
		if (error)
		{
			this.conversationsManager.endConversation(message.author.id);
			this.bot.reply(message, 'Sorry, an unexpected ' + error.source + ' error occurred. Conversation aborted.');
		}
		else
		{
			var enjinUserID = null;
			for (var keyEnjinUserID in dataJSON.result)
			{
				if (dataJSON.result[keyEnjinUserID].username === enjinUsername)
				{
					enjinUserID = keyEnjinUserID;
					break;
				};
			};
			if (enjinUserID)
			{
				this.enjinMailUserSession.getID((function(mailUserSessionID)
				{
					var authenticationCode = this.TokenGenerator.generate();
					this.conversationsManager.amendConversationData(message.author.id, {enjinUserID: enjinUserID, authenticationCode: authenticationCode});
					var enjinRequest = EnjinRequestTemplates.sendMessage;
					enjinRequest.params.session_id = mailUserSessionID;
					enjinRequest.params.message_subject = 'Discord Authentication Code';
					enjinRequest.params.message_body = 'This is an automated message.\n\nMessage the following code to the Enjin Helper Robot in Discord.\n\n[b]Code: ' + authenticationCode + '[/b]';
					enjinRequest.params.recipients = [enjinUserID];
					console.log('authenticationCode: ' + authenticationCode);
					Utilities.conductEnjinRequest.call(this, enjinRequest, false, 'handleEnjinUserIdentification', function(dataJSON, error)
					{
						if (error)
						{
							this.conversationsManager.endConversation(message.author.id);
							this.bot.reply(message, 'Sorry, an unexpected ' + error.source + ' error occurred. Conversation aborted.');
						}
						else
						{
							this.conversationsManager.setConversationStage(message.author.id, 'authenticationCode');
							this.bot.reply(message, 'I have sent a code to your Enjin mail. Please message it to me here.');
						};
					});
				}).bind(this));
			}
			else
			{
				this.bot.reply(message, 'Sorry, I could not find a user by that name. Please try again.');
			};
		};
	});
};

function handleAuthenticationCode(conversation, message)
{
	var codeFromUser = message.content;
	if (codeFromUser === conversation.data.authenticationCode && this.TokenGenerator.isValid(codeFromUser))
	{
		addMember.call(this, conversation, message);
	}
	else
	{
		this.bot.reply(message, 'Sorry, your code is wrong. Please try again.');
	};
};

function addMember(conversation, message)
{
	FileSystem.readFile(global.appPath('Data/userAssociations.json'), 'utf8', (function(error, data)
	{
		if (error)
		{
			if (error.errno === -4058)
			{
				writeMembers.call(this, conversation.data.enjinUserID, message.author.id, conversation, message);
			}
			else
			{
				console.log('Unknown file error attempting to read userAssociations.json.');
				this.bot.reply(message, 'Unexpected file error. Please try again.');
			};
		}
		else
		{
			amendMembers.call(this, conversation.data.enjinUserID, message.author.id, data, conversation, message);
		};
	}).bind(this));
};

function amendMembers(enjinUserID, discordMemberID, data, conversation, message)
{
	var members = JSON.parse(data);
	members.push({'enjinUserID': enjinUserID, 'discordMemberID': discordMemberID});
	writeMembers.call(this, discordMemberID, members, conversation, message);
};

function createMembers(enjinUserID, discordMemberID, conversation, message)
{
	var members = [{'enjinUserID': enjinUserID, 'discordMemberID': discordMemberID}];
	writeMembers.call(this, discordMemberID, members, conversation, message);
};

function writeMembers(discordMemberID, members, conversation, message)
{
	FileSystem.writeFile(global.appPath('Data/userAssociations.json'), JSON.stringify(members), 'utf8', (function(error)
	{
		if (error)
		{
			this.bot.reply(message, 'Unexpected file error. Please try again.');
		}
		else
		{
			this.conversationsManager.endConversation(message.author.id);
			AssociateMember.fulfilMemberRoles.call(this, this.bot.servers[0].members.get('id', discordMemberID));
			this.bot.reply(message, 'Your Enjin and Discord accuonts are now associated. Your permissions have been granted. Have fun!');
		};
	}).bind(this));
};