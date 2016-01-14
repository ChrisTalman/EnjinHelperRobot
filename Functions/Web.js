module.exports = Web;

var Express = require('express');
var bodyParser = require('body-parser');
var Browse = require('./Browse');

function Web(robotParameters)
{
	initialise();
	function initialise()
	{
		var app = Express();
		app.listen(robotParameters.settings.web.port, function ()
		{
			//console.log('Web server listening on port ' + robotParameters.settings.web.port + '!');
		});
		app.use(bodyParser.json());
		app.use(Express.static('Web'));
		app.post('/api', function (request, response)
		{
			Browse.handleRequest.call(robotParameters, request, response);
		});
	};
};