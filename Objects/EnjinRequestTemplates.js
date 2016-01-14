var getUserTags =
{
	"jsonrpc": "2.0",
	"id": "12345",
	"method": "Tags.get",
	"params": {
		"api_key": "123",
		"user_id": "123456"
	}
};

var getTagUsers =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "UserAdmin.get",
	"params": {
		"api_key": "123",
		"tag_id": "123456"
	}
};

var getSiteTags =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "Tags.getTagTypes",
	"params": {
		"api_key": "123"
	}
};

var getAllUsers =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "UserAdmin.get",
	"params": {
		"api_key": "123"
	}
};

var userLogin =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "User.login",
	"params": {
		"email":"email",
		"password":"password"
	}
};

var checkSession =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "User.checkSession",
	"params": {
		"session_id":"123"
	}
};

var sendMessage =
{
    "jsonrpc": "2.0",
	"id": "12345",
	"method": "Messages.sendMessage",
	"params": {
	    "session_id":"123",
		"message_subject":"Subject",
		"message_body":"Message",
		"recipients":['abc']
	}
};

var tagUser =
{
	"jsonrpc": "2.0",
	"id": "12345",
	"method": "Tags.tagUser",
	"params": {
		"api_key": "123",
		"user_id": "123",
		"tag_id": "123"
	}
};

var untagUser =
{
	"jsonrpc": "2.0",
	"id": "12345",
	"method": "Tags.untagUser",
	"params": {
		"api_key": "123",
		"user_id": "123",
		"tag_id": "123"
	}
};

module.exports =
{
	getUserTags:getUserTags,
	getTagUsers:getTagUsers,
	getSiteTags:getSiteTags,
	getAllUsers:getAllUsers,
	userLogin:userLogin,
	checkSession:checkSession,
	sendMessage:sendMessage,
	tagUser:tagUser,
	untagUser:untagUser
};