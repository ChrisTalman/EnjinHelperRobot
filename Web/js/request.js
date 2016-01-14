function Request(resourceURL, requestMethod, requestArguments)
{
	var request = null;
	var response = null;
	var responseJSON = null;
	var onLoadFunctions = [];
	if (typeof(resourceURL) !== 'string')
	{
		throw 'TypeError: resourceURL must be string.';
	}
	else if (typeof(requestMethod) !== 'string')
	{
		throw 'TypeError: requestMethod must be string.';
	}
	else if (requestMethod !== 'GET' && requestMethod !== 'POST')
	{
		throw 'TypeError: requestMethod "' + requestMethod + '" not supported. Must be "GET" or "POST.';
	}
	else if (requestArguments !== undefined && typeof(requestArguments) !== 'object')
	{
		throw 'TypeError: requestArguments must be object.';
	}
	else
	{
		var arguments = '';
		for (var argument in requestArguments)
		{
			if (arguments.length === 0)
			{
				arguments = argument + '=' + requestArguments[argument];
			}
			else
			{
				arguments += '&' + argument + '=' + requestArguments[argument];
			}
		}
		request = new XMLHttpRequest();
		if (requestMethod === 'GET')
		{
			request.open(requestMethod, resourceURL + '?' + arguments);
			request.send(null);
		}
		else if (requestMethod == 'POST')
		{
			request.open(requestMethod, resourceURL);
			request.setRequestHeader('Content-Type', 'application/json');
			request.send(JSON.stringify(requestArguments));
		}
		request.addEventListener('readystatechange', loaded.bind(this));
	}
	// Public
	this.__defineGetter__('url', function()
	{
		return resourceURL;
	});
	this.__defineSetter__('url', function()
	{
		throw 'SecurityError: The url of Request cannot be assigned or changed';
	});
	this.__defineGetter__('json', function()
	{
		if (responseJSON === null)
		{
			try
			{
				responseJSON = JSON.parse(response);
			}
			catch (Error)
			{
				responseJSON = {};
				console.log('The request\'s response does not contain valid JSON, and cannot be parsed.');
			}
		}
		return responseJSON;
	});
	this.__defineSetter__('json', function()
	{
		throw 'SecurityError: The json of Request cannot be assigned or changed';
	});
	this.__defineGetter__('api', function()
	{
		return request;
	});
	this.__defineSetter__('api', function()
	{
		throw 'SecurityError: The api of Request cannot be assigned or changed';
	});
	this.onLoad = function(functionReference, arguments)
	{
		if (typeof(functionReference) === 'function' && arguments instanceof Array)
		{
			onLoadFunctions.push({functionReference: functionReference, arguments: arguments});
		}
		else if (arguments === undefined)
		{
			onLoadFunctions.push({functionReference: functionReference, arguments: null});
		}
		else if (typeof(functionReference) !== 'function')
		{
			throw 'TypeError: functionReference must be function.';
		}
		else if (!arguments instanceof Array)
		{
			throw 'TypeError: arguments must be Array.';
		}
	}
	// Private
	function loaded()
	{
		if (request.readyState === 4)
		{
			response = request.response;
			if (onLoadFunctions.length > 0)
			{
				for (var onLoadFunctionIndex in onLoadFunctions)
				{
					onLoadFunctions[onLoadFunctionIndex].functionReference.apply(null, onLoadFunctions[onLoadFunctionIndex].arguments);
				}
			}
		}
	}
}