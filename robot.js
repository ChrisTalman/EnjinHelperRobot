/*

To Do!
* Introduce standard console.log() function with timestamp, function, and brief error description, for all requests and other functionality
* Notification to guest could be defined in settings.json for user configuration
* Activity log could include robot going online and offline
* Enable users to access the webpage through a link provided by the robot after calling the !view command. To this end, the URL will need to be recorded somehow, and the webpage made available outside localhost and on the internet
* Help could be provided in the web interface, including documentation as to all the commands
* Web interface may need authentication, such as a code provided by the robot in a link to the user
* Enable accepting Enjin applications through robot
* User roles need to be updated in intervals
* Ensure that the robot can handle members that leave a server (i.e. members that become 'no longer members'). The robot currently assumes that members will always exist on the server, when they can in fact leave.
	* This is also true for roles, roles could be deleted

*/

console.log('Enjin Helper Robot starting.');

global.appPath = (path => __dirname + '/' + path);

var FileSystem = require('fs');
var Discord = require('discord.js');
var Utilities = require('./Functions/Utilities');
var DiscordUtilities = require('./Functions/DiscordUtilities');
var EnjinRequestTemplates = require('./Objects/EnjinRequestTemplates');
var EnjinSession = require('./Functions/EnjinSession');
var ConversationsManager = require('./Functions/ConversationsManager');
var AssociateMember = require('./Functions/AssociateMember');
var UpdateMember = require('./Functions/UpdateMember');
var AssociateRole = require('./Functions/AssociateRole');
var DisassociateMember = require('./Functions/DisassociateMember');
var DisassociateRole = require('./Functions/DisassociateRole');
var Enroll = require('./Functions/Enroll');
var TokenGenerator = require('token-generator')({salt: 'sjdkju2ejsdjajd920uejsaijdsjaijdihfjgfnkwjiueioej', timestampMap: 'abcdefghij'});
var Web = require('./Functions/Web');
var DiscordMonitor = require('./Functions/DiscordMonitor');
var Browse = require('./Functions/Browse');
var Help = require('./Functions/Help');
var UpdateRobot = require('./Functions/UpdateRobot');
var RoleMention = require('./Functions/RoleMention');

/* Initialise */
initialise();
function initialise()
{
	FileSystem.readFile(global.appPath('Data/settings.json'), 'utf8', handleSettingsLoaded);
};

function handleSettingsLoaded(error, data)
{
	if (error)
	{
		console.log('Error loading settings.');
	}
	else
	{
		var settings = JSON.parse(data);
		establishRobot(settings);
	};
};

/* Robot */
function establishRobot(settings)
{
	var robot = new Discord.Client();
	var conversationsManager = new ConversationsManager();
	var enjinMailUserSession = new EnjinSession(settings.enjin.mail_user.email, settings.enjin.mail_user.password, settings.enjin.api_url, 'ik0j543g7bugrvmno27am81jb3');
	var discordMonitor = new DiscordMonitor(robot, settings, conversationsManager);
	var robotParameters = {'bot': robot, 'settings': settings, 'conversationsManager': conversationsManager, 'enjinMailUserSession': enjinMailUserSession, 'TokenGenerator': TokenGenerator};
	var web = new Web(robotParameters);
	robot.on('message', handleMessage.bind(robotParameters));
	robot.on('ready', handleReady.bind(robotParameters));
	robot.on('disconnected', handleDisconnected.bind(robotParameters));
	robotLogin(robot, settings);
};

function handleMessage(message)
{
	if (message.author !== this.bot.user)
	{
		if (message.channel.isPrivate)
		{
			var command = message.content.split(' ')[0];
			if (command === '!die')
			{
				killRobot.call(this, message);
			}
			else if (command === '!abort')
			{
				if (this.conversationsManager.userConversing(message.author.id))
				{
					this.conversationsManager.endConversation(message.author.id);
					this.bot.reply(message, 'I\'m sorry that you feel this way. :frowning:');
				}
				else
				{
					this.bot.reply(message, 'Sorry, I cannot abort a conversation that does not exist.');
				};
			}
			else if (this.conversationsManager.userConversing(message.author.id))
			{
				var conversation = this.conversationsManager.getConversation(message.author.id).conversation;
				switch(conversation.type)
				{
					case 'unenrolledMember':
						Enroll.handleConversation.call(this, conversation, message);
						break;
				};
			}
			else
			{
				switch (command)
				{
					case 'ping':
						this.bot.reply(message, 'Pong!');
						break;
					case '!help':
						Help.get.call(this, message);
						break;
					case '!updateMember':
						UpdateMember.updateMember.call(this, message);
						break;
					case '!associateMember':
						AssociateMember.associateMember.call(this, message);
						break;
					case '!associateRole':
						AssociateRole.associateRole.call(this, message);
						break;
					case '!disassociateMember':
						DisassociateMember.disassociateMember.call(this, message);
						break;
					case '!disassociateRole':
						DisassociateRole.disassociateRole.call(this, message);
						break;
					case '!enroll':
						Enroll.manualEnroll.call(this, message);
						break;
					case '!guestify':
						DiscordUtilities.guestify.call(this, message);
						break;
					case '!browse':
						Browse.getLink.call(this, message);
						break;
					case '!updateRobot':
						UpdateRobot.call(this);
						break;
					default:
						this.bot.reply(message, 'Sorry, I do not know what you mean. :frowning:');
				};
			};
		}
		else
		{
			RoleMention.call(this, message);
		};
	};
};

function handleReady()
{
	console.log('Enjin Helper Robot ready.');
	var server = this.bot.servers[0];
	var members = server.members;
	var bluecewe = members.get('username', 'Bluecewe | Xterea');
	var satriAli = members.get('username', 'SatriAli');
	//console.log(server.rolesOfUser(bluecewe)[0].name);
};

function killRobot(message)
{
	if (DiscordUtilities.isMemberAuthorised.call(this, message.author))
	{
		console.log('Goodnight, dear friend.');
		this.bot.reply(message, 'Goodnight, dear friend.', function()
		{
			process.exit();
		});
	}
	else
	{
		this.bot.reply(message, 'You are not authorised to end my life.');
	};
};

function robotLogin(robot, settings)
{
	robot.login(settings.discord.user.email, settings.discord.user.password, function(error)
	{
		if (error)
		{
			console.log('Enjin Helper Robot failed to login. Retrying.');
			robotLogin(robot, settings);
		};
	});
};

function handleDisconnected()
{
	console.log('Enjin Helper Robot was disconnected.');
	robotLogin(this.bot, this.settings);
};