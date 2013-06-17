(function ($) {
var defaults = {
	targetWindow: window,
	targetOrigin: '*'
};

var requests = {}, responses = {};
window.requests = requests;
window.responses = responses;

window.please = function (targetWindow, targetOrigin) {
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

please.defaults = function (values) {
	$.extend(true, defaults, values);
};

please.init = function (thisWindow) {
	thisWindow.addEventListener('message', please_messageHandler)
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
	// todo: check for origin

	try {
		var data = JSON.parse(messageEvent.data);
	} catch (e) {
		return;
	}

	if (data.type === 'request') {
		var response = new Response(data);
		responses[response.id] = response.data;
		response.targetWindow = messageEvent.source;
		response.targetOrigin = messageEvent.origin;
		response.send();
	} 
	else if (data.type === 'response') {
		requests[data.id].resolve(data.data);
		delete requests[data.id];
	}
};

please.call = please_request('call');
please.set = please_request('set');
please.get = please_request('get');
please.eval = please_request('eval');
please.$ = please_request('$');
please.$ = $.extend(please.$, (function () {
	var req = {};
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

			var newReq = new Request('$_fn');
			newReq.data = [this, funcName].concat(args);
			newReq.send();
			return newReq;
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
})());

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

var please_get = function (key) {
	var arr = key.split('.'),
		retVal = window;
	arr.forEach(function (item) {
		retVal = retVal[item];
	});
	return retVal;
};

var please_eval = function (statements) {
	$.globalEval(statements);
};

var please_$ = function () {
	return $.apply($, [].slice.call(arguments));
};

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
		retval = $jq[funcName].apply(store[promiseId], args);
	}

	try {
		// check if object is serializable
		var retval_array = retval instanceof $ ? retval.toArray() : retval;
		// firefox happens to serialize Nodes somehow, check and throw if so
		if (retval_array && retval_array.length && retval_array[0] instanceof Node) throw '';
		vwoe_$.toJSON(retval_array);
		return retval_array;
	} catch (e) {
		return parentReq.id;
	}
};

function Request(name) {
	this.init.apply(this, [].slice.call(arguments));
}

function Response(req) {
	this.init(req);
}

Request.prototype = {
	init: function (name) {
		$.extend(this, $.Deferred());

		var id = + new Date;
		while (id === + new Date);
		id = + new Date;

		this.id = id;
		this.name = name;
		this.data = [].slice.call(arguments);

		requests[id] = this;
	},
	send: function () {
		this.targetWindow = this.targetWindow || defaults.targetWindow;
		this.targetOrigin = this.targetOrigin || defaults.targetOrigin;

		console.log(window.location.href, 'sent message:', JSON.stringify(this));

		this.targetWindow.postMessage(JSON.stringify(this), this.targetOrigin);
	},
	perform: function () {
		var please_fn;
		eval('please_fn = please_' + this.name);
		return please_fn.apply(this, this.data);
	},
	toJSON: function () {
		return {
			id: this.id,
			name: this.name,
			type: 'request',
			data: this.data
		};
	}
};

Request.create = function (obj) {
	return $.extend(new Request(), obj);
};

Response.prototype = {
	init: function (req) {
		this.id = req.id;
		this.name = req.name;
		this.data = Request.create(req).perform();
	},
	send: function () {
		this.targetWindow.postMessage(JSON.stringify(this), this.targetOrigin);
	},
	toJSON: function () {
		return {
			id: this.id,
			name: this.name,
			type: 'response',
			data: this.data
		}
	}
};

})(jQuery);
