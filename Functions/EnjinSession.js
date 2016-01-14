module.exports = EnjinSession;

var Request = require('request');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');

function EnjinSession(enjinEmail, ejinPassword, enjinAPIURL, preSessionID)
{
	var enjinSessionID = null;
	initialise();
	// Public
	this.getID = function(callback)
	{
		isSessionValid(callback);
	};
	// Private
	function initialise()
	{
		if (preSessionID)
		{
			enjinSessionID = preSessionID;
		}
		else
		{
			createSession();
		};
	};
	function createSession(callback)
	{
		var enjinRequest = EnjinRequestTemplates.userLogin;
		enjinRequest.params.email = enjinEmail;
		enjinRequest.params.password = ejinPassword;
		Request.post({url: enjinAPIURL, json: enjinRequest}, (function(error, httpResponse, dataJSON)
		{
			if (dataJSON.error)
			{
				console.log('An Enjin error occurred during session login. Code: ' + dataJSON.error.code + '. Message: ' + dataJSON.error.message + '.');
			}
			else
			{
				enjinSessionID = dataJSON.result.session_id;
				callback.call(this, enjinSessionID);
			};
		}).bind(this));
	};
	function isSessionValid(callback)
	{
		var enjinRequest = EnjinRequestTemplates.checkSession;
		enjinRequest.params.session_id = enjinSessionID;
		Request.post({url: enjinAPIURL, json: enjinRequest}, (function(error, httpResponse, dataJSON)
		{
			if (dataJSON.error)
			{
				console.log('An Enjin error occurred during session check. Code: ' + dataJSON.error.code + '. Message: ' + dataJSON.error.message + '.');
				createSession(callback);
			}
			else
			{
				callback.call(this, enjinSessionID);
			};
		}).bind(this));
	};
};