module.exports = ConversationsManager;

function ConversationsManager()
{
	var conversations = [];
	this.startConversation = function(discordUserID, conversationType, conversationStage)
	{
		conversations.push({discordUserID: discordUserID, type: conversationType, stage: conversationStage, data: {}});
	};
	this.setConversationStage = function(discordUserID, stage)
	{
		if (typeof stage === 'string')
		{
			var conversationData = this.getConversation(discordUserID);
			conversations[conversationData.conversationIndex].stage = stage;
		}
		else
		{
			throw 'Conversation stage must be string. Got ' + typeof stage + '.';
		};
	};
	this.amendConversationData = function(discordUserID, amendment)
	{
		var data = conversations[this.getConversation(discordUserID).conversationIndex].data;
		for (var key in amendment)
		{
			data[key] = amendment[key];
		};
	};
	this.endConversation = function(discordUserID)
	{
		conversations.splice(this.getConversation(discordUserID).conversationIndex, 1);
	};
	this.userConversing = function(discordUserID)
	{
		if (this.getConversation(discordUserID).conversation)
		{
			return true;
		}
		else
		{
			return false;
		};
	};
	this.getConversation = function(discordUserID)
	{
		var conversation = null;
		for (var conversationIndex = 0; conversationIndex < conversations.length; conversationIndex++)
		{
			if (conversations[conversationIndex].discordUserID === discordUserID)
			{
				conversation = conversations[conversationIndex];
				break;
			};
		};
		return {conversation: conversation, conversationIndex: conversationIndex};
	};
};