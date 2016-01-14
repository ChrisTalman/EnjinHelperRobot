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
		app.listen(3000, function ()
		{
			//console.log('Example app listening on port 3000!');
		});
		app.use(bodyParser.json());
		app.use(Express.static('Web'));
		app.post('/api', function (request, response)
		{
			Browse.handleRequest.call(robotParameters, request, response);
		});
	};
};