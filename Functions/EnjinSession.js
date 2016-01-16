module.exports = EnjinSession;

var Request = require('request');
var EnjinRequestTemplates = require('../Objects/EnjinRequestTemplates');
var Utilities = require('../Functions/Utilities');

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
		Utilities.conductEnjinRequest.call(this, enjinRequest, 'createSession', false, function(dataJSON, error)
		{
			if (error)
			{
				callback.call(this, null, error);
			}
			else
			{
				enjinSessionID = dataJSON.result.session_id;
				callback.call(this, enjinSessionID, null);
			};
		});
	};
	function isSessionValid(callback)
	{
		var enjinRequest = EnjinRequestTemplates.checkSession;
		enjinRequest.params.session_id = enjinSessionID;
		Utilities.conductEnjinRequest.call(this, enjinRequest, 'isSessionValid', false, function(dataJSON, error)
		{
			if (error)
			{
				createSession(callback);
			}
			else
			{
				enjinSessionID = dataJSON.result.session_id;
				callback.call(this, enjinSessionID, null);
			};
		});
	};
};