(function ($) {
var defaults = {
	targetWindow: window,
	targetOrigin: '*',
	sourceOrigin: false
};

/**
 * The please global object. Can be used both as an object and a function.
 * 
 * @param  {String} [targetWindow] The reference to the window to pass messages to.
 * @param  {String} [targetOrigin] What the target origin of the other window must be.
 * @return {Object} A please object instance.
 */
var please = function (targetWindow, targetOrigin) {
	return $.extend(please.bind(), {
		targetWindow: targetWindow,
		targetOrigin: targetOrigin,
		call: please.call,
		set: please.set,
		get: please.get,
		eval: please.eval,
		$: please.$
	});
};

var requests = {}, responses = {};
window.please = please;
please.requests = requests;
please.responses = responses;

/**
 * Sets the default targetWindow to send message to, and the targetOrigin of that window.
 * 
 * @param  {String} values Params to use as defaults.
 * @return {Object} A please object instance.
 */
please.defaults = function (values) {
	$.extend(true, defaults, values);
	return please;
};

/**
 * Initialize please. In both the windows (frames), add the below code:
 * 
 * @param  {Window} thisWindow The reference to the current window.
 * @return {Object} A please object instance.
 */
please.init = function (thisWindow) {
	thisWindow.addEventListener('message', please_messageHandler);
	return please;
};

var please_request = function (requestName) {
	return function () {
		var req = new Request(requestName);
		req.targetWindow = this.targetWindow || defaults.targetWindow;
		req.targetOrigin = this.targetOrigin || defaults.targetOrigin;
		req.data = [].slice.call(arguments);
		req.send();
		return req;
	};
};

var please_messageHandler = function (messageEvent) {
	
	if ($.isFunction(defaults.sourceOrigin)) {
		if (!defaults.sourceOrigin(messageEvent)) {
			return;
		}
	}

	try {
		var data = JSON.parse(messageEvent.data);
	} catch (e) {
		console.log('error parsing json data');
		return;
	}

	if (data.type === 'request') {
		var response = new Response(data);
		responses[response.id] = response.data;
		response.targetWindow = messageEvent.source;

		// messageEvent.origin is 'null' in case of file:// url.
		// For such environment we use the default targetOrigin
		response.targetOrigin = messageEvent.origin === 'null' ? defaults.targetOrigin : messageEvent.origin;
		
		response.send();
	} 
	else if (data.type === 'response') {
		if (data.data && data.data.type === 'unserializable') {
			data.data = UnserializableResponseData.create(data.data);
		}
		if (data.success) {
			requests[data.id].resolve(data.data);
		} else {
			requests[data.id].reject(new please.Error(data.data));
		}
		
		delete requests[data.id];
	}
};

/**
 * Invokes a function functionName in the other window. Pass any arguments needed
 * after the functionName. Returns a jQuery promise object. After the function is
 * invoked in the other frame, the promise is resolved to the return value of the
 * function.
 *
 * You could also call a method on another object. Just pass the object name in 
 * the functionName as well like object.someMethod.
 * 
 * @param  {String} functionName The function name to call in the other window.
 * @param  {...} args... Any parameters to pass to the function.
 * @return {Promise} A jQuery promise object. Resolves to either the return value
 * of the function, or fails resolution if an error occurs in the other window.
 */
please.call = please_request('call');

/**
 * Sets a global variable or a property on an object in the other window. 
 * Returns a jQuery promise object. After the property is set, the promise 
 * object is resolved.
 *
 * @param  {String} propertyName The property to set in the other window.
 * @param  {String} propertyValue The value to set the property to.
 * @return {Promise} A jQuery promise object. Resolves when the property has
 * been successfully set in the other window. Fails resolution otherwise.
 */
please.set = please_request('set');

/**
 * Gets a value of a global variable or a property on an object in the 
 * other window. Returns a jQuery promise object that resolves with the 
 * value of the property requested.
 * 
 * @param  {String} propertyName The property to get from the other window.
 * @param  {String} propertyValue The value to set the property to.
 * @return {Promise} A jQuery promise object. Resolves to the value of the property
 * returned by the other window. Fails resolution if an error is thrown.
 */
please.get = please_request('get');

/**
 * Evals a string in the other window in global scope. Uses jQuery.globalEval
 * internally.
 * 
 * @param  {String} evalString The string to eval.
 * @return {Promise} A jQuery promise object. Resolves if the string evals
 * successfully. Fails to resolve if an error is thrown.
 */
please.eval = please_request('eval');

/**
 * Triggers jQuery on the other window. Returns a promise object with jQuery functions
 * overloaded on it that can be chained to perform complicated tasks in the other
 * window as if it was this window's own.
 * 
 * @param {String} selector The selector to select an element in the other window.
 * @return {jQueryPromise} A promise object overloaded with jQuery methods to support
 * chaining.
 */
please.$ = please_request('$');
please.$ = function () {
	var req = please_request('$').apply(this, [].slice.call(arguments));
	var jquery_fns = Object.keys($.fn);
	var mapObjectFunctionsToStrings = function (obj) {
		for (var i in obj) {
			if (typeof obj[i] === 'function') {
				obj[i] = obj[i].toString();
			}
		}
	};

	var mapArrayFunctionsToStrings = function (args) {
		return args.map(function (arg) {
			if (typeof arg === 'function') {
				return arg.toString();
			}
			if (typeof arg === 'object') {
				$.extend(true, {}, arg);
				mapObjectFunctionsToStrings(arg);
			}
			return arg;
		});
	};

	var $_fn = function (funcName) {
		return function () {
			var args = [].slice.call(arguments);
			args = mapArrayFunctionsToStrings(args);

			var req = new Request('$_fn');
			req.targetWindow = this.targetWindow || defaults.targetWindow;
			req.targetOrigin = this.targetOrigin || defaults.targetOrigin;
			req.data = [this, funcName].concat(args);
			req.send();
			return req;
		};
	};

	for (var k = 0, kl = jquery_fns.length; k < kl; k++) {
		var funcName = jquery_fns[k];
		if (funcName === 'constructor' || funcName === 'init' || funcName === 'promise') continue;

		if (typeof $.fn[funcName] === 'function') {
			req[funcName] = $_fn(funcName);
		} else if (funcName === 'length') {
			//req.__defineGetter__(funcName, $_fn(funcName));
		}
	}

	var custom_fns = [
		'draggable', 'sortable' // add your custom function names here.
	];

	for (k = 0, kl = custom_fns.length; k < kl; k++) {
		var funcName = custom_fns[k];
		req[funcName] = $_fn(funcName);
	}

	return req;
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls please.call.
 *
 * @private
 * @param  {String} funcName The name of the function to call.
 * @return {*} Returns whatever is returned by the called function
 * @throws {Error} Throws an error if the called function throws an error.
 */
var please_call = function (funcName) {
	var arr = funcName.split('.'),
		context,
		func = context = window,
		data = [].slice.call(arguments, 1);
	arr.forEach(function (item, i) {
		if (i === arr.length - 1) {
			context = func;
		}
		func = func[item];
	});
	return func.apply(context, data);
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls please.set.
 *
 * @private
 * @param  {String} key The key to set.
 * @param  {*} value The value to set the key to.
 */
var please_set = function (key, value) {
	var arr = key.split('.');
	var retVal = window;
	arr.forEach(function (item, i) {
		if (i === arr.length - 1) {
			retVal[item] = value;
		} else {
			retVal = retVal[item];
		}
	});
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls please.get.
 *
 * @private
 * @param  {String} key The variable / property to get the value of.
 * @return {*} The value of the requested property / variable.
 */
var please_get = function (key) {
	var arr = key.split('.'),
		retVal = window;
	arr.forEach(function (item) {
		retVal = retVal[item];
	});
	return retVal;
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls please.eval.
 *
 * @private
 * @param  {String} statements The statements to eval in the target frame.
 */
var please_eval = function (statements) {
	return $.globalEval(statements);
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls please.$
 *
 * @private
 * @return {jQuery} The jQuery object created using the selector passed.
 */
var please_$ = function () {
	return $.apply($, [].slice.call(arguments));
};

/**
 * Internal function called in the target frame when the requesting frame
 * calls a function chained on any please.$
 *
 * @private
 * @param  {Request} parentReq The request sent in the previous chain-call.
 * @param  {String} funcName The jQuery function name to call on the response
 * of the parent request.
 * @return {*} Returns whatever is returned by the called jQuery object method.
 */
var please_$_fn = function (parentReq, funcName) {
	var $jq = responses[parentReq.id];
	if (!($jq instanceof $)) return null;

	var args = [].slice.call(arguments, 2);
	for (var i = 0; i < args.length; i++) {
		args[i] = (function (arg) {
			if (typeof arg === 'string') try {
				var fn;
				eval ('fn = ' + arg);
				if (typeof fn === 'function') {
					return fn;
				}
				return arg;
			} catch (e) {
				return arg;
			}

			if (typeof arg === 'object') {
				mapObjectStringsToFunctions(arg);
			}
			return arg;
		})(args[i]);
	}

	var retval;
	if (funcName === 'length') {
		retval = $jq.length;
	} else {
		retval = $jq[funcName].apply($jq, args);
	}
	return retval;
};

/**
 * Creates a Request object instance.
 *
 * @param {String} name The name of the request.
 * @class Request
 * @constructor
 */
function Request(name) {
	this.init.apply(this, [].slice.call(arguments));
}

/**
 * Creates a Response object instance.
 * 
 * @param {Request} req The Request object this Response is associated with.
 * @class Response
 * @constructor
 */
function Response(req) {
	this.init(req);
}

Request.prototype = {
	/**
	 * Initializes a Request object instance.
	 * 
	 * @param  {String} name The name of the request.
	 */
	init: function (name) {
		$.extend(this, $.Deferred());

		var id = + new Date;
		while (id === + new Date);
		id = + new Date;

		this.id = id;
		this.name = name;
		this.data = [].slice.call(arguments);
		this.type = 'request';

		requests[id] = this;
	},

	/**
	 * Sends the request to the target window.
	 */
	send: function () {
		this.targetWindow = this.targetWindow || defaults.targetWindow;
		this.targetOrigin = this.targetOrigin || defaults.targetOrigin;

		try {
			// check if object is serializable
			var jq = this.data;
			var jq_array = jq instanceof $ ? jq.toArray() : jq;
	        // firefox happens to serialize Nodes somehow, check and throw if so
	        if (jq_array && jq_array.length && jq_array[0] instanceof Node) throw '';
			this.targetWindow.postMessage(JSON.stringify(this), this.targetOrigin);
		} catch (e) {
			this.targetWindow.postMessage(new UnserializableResponseData(this.id), this.targetOrigin);
		}
	},
	/**
	 * Performs the request by calling the internal function associated with the
	 * request name.
	 * 
	 * @return {*} Returns whatever is returned by the corresponding request function.
	 */
	perform: function () {
		return eval('please_' + this.name).apply(this, this.data);
	},

	/**
	 * Returns a stringifyable JSON for JSON.stringify.
	 */
	toJSON: function () {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			data: this.data
		};
	}
};

/**
 * Creates a Request object instance by using a hash of default values.
 * 
 * @param  {Object} obj The hash of default values to override.
 * @return {Request} A Request object instance.
 */
Request.create = function (obj) {
	return $.extend(new Request(), obj);
};

Response.prototype = {
	/**
	 * Initializes a Response object instance.
	 * 
	 * @param  {Request} req The Request object this Response is associated with.
	 */
	init: function (req) {
		this.id = req.id;
		this.name = req.name;
		this.type = 'response';
		try {
			this.data = Request.create(req).perform();
			this.success = true;
		} catch (error) {
			this.data = new please.Error(error);
			this.success = false;
		}
	},

	/**
	 * Sends the Response data to the requesting window.
	 */
	send: function () {
		try {
			this.targetWindow = this.targetWindow || defaults.targetWindow;
			this.targetOrigin = this.targetOrigin || defaults.targetOrigin;

			// check if object is serializable
			var jq = this.data;
			var jq_array = jq instanceof $ ? jq.toArray() : jq;
	        // firefox happens to serialize Nodes somehow, check and throw if so
	        if (jq_array && jq_array.length && jq_array[0] instanceof Node) throw '';
	        JSON.stringify(this)
			this.targetWindow.postMessage(JSON.stringify(this), this.targetOrigin);
		} catch (e) {
			this.data = new UnserializableResponseData(this.id);
			this.targetWindow.postMessage(JSON.stringify(this), this.targetOrigin);
		} finally {
			if (!this.success) {
				throw this.data.error;
			}
		}
	},
	/**
	 * Returns a stringifyable JSON for JSON.stringify.
	 */
	toJSON: function () {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			data: this.data,
			success: this.success
		}
	}
};

/**
 * If an object is cyclic and cannot be serialized to send to the requesting frame
 * as response data, an object instance of UnserializableResponseData is sent instead.
 * This object instance in the other window acts as a proxy to the actual object.
 * Any further operations on this object can be performed in the other window using the
 * UnserializableResponseData instance.
 *
 * @private
 * @param {Number} requestId The requestId of the request this UnserializableResponseData
 * is associated with.
 */
function UnserializableResponseData (requestId) {
	this.id = requestId;
	this.type = 'unserializable';
}

/**
 * Creates a UnserializableResponseData object instance by using a hash of default values.
 * 
 * @param  {Object} obj The hash of default values to override.
 * @return {Request} A Unserializable object instance.
 */
UnserializableResponseData.create = function (obj) {
	var data = $.extend(new UnserializableResponseData(), obj);
	return data;
};

please.Error = function (error) {
	this.error = error;
	$.extend(this, error);
	this.name = error.name;
	this.message = error.message;

	// IE
	this.number = error.number;
	this.description = error.description;

	// Firefox
	this.fileName = error.fileName;
	this.lineNumber = error.lineNumber;

	// Chrome / Firefox / latest IE
	this.stack = error.stack;
};

// expose Request, Response and UnserializableResponseData in the please namespace.
please.Request = Request;
please.Response = Response;
please.UnserializableResponseData = UnserializableResponseData;

})(jQuery);
