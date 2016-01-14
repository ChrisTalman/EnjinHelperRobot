module.exports =
{
	get:get
};

function get(message)
{
	var helpMessage = `Some of these commands require admin authorisation.
	\`!enroll\` Begin conversation with robot to link your Discord user with your Enjin user.
	\`!abort\` Abort a conversation with robot.
	\`!guestify "Discord Username"\` Grant the guest role to a Discord user.
	\`!help\` This message that you are reading.
	\`!browse\` Ask the robot for a web link to view user and role associations.
	\`!associateMember "Enjin Username" "Discord Username"\` Associate an Enjin user with a Discord user.
	\`!associateRole "Discord Role Name" "Enjin Tag Name"\` Associate a Discord role with an Enjin tag.
	\`!disassociateMember "Discord Username"\` Disassociate a Discord user.
	\`!disassociateRole "Discord Role Name"\` Disassociate a Discord role.`
	this.bot.reply(message, helpMessage);
};