please.init(window);


module('please basic test');

asyncTest('Basic communication with the child frame', function () {
	var childFrame = $('#child-frame').get(0);
	var timeout = setTimeout(function () {
		ok(0, "Timeout occured.");
		start();
	}, 2000);

	please(childFrame.contentWindow).call('sayHello').then(function (messageFromChild) {
		clearTimeout(timeout);
		equal('Hello from child!', messageFromChild, 'Hello world handshake test passed');
		start();
	});
});

module('please.defaults');
asyncTest('Overring defaults', function () {
	var childFrame = $('#child-frame').get(0);
	
	please.defaults({
		targetWindow: childFrame.contentWindow
	});
	ok(1, "Sent a request");

	runTestOnIframeLoad(function () {

		please.call('sayHello').then(function (messageFromChild) {
			ok(1, "Received a response");
			equal('Hello from child!', messageFromChild, 'please.defaults.contentWindow configuration works');
			start();
			// reset / teardown
			please.defaults({targetWindow: window});
		});
		
	});
});

module('please.defaults.sourceOrigin');
asyncTest('Does not respond to invalid origin', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('setupSourceOriginTest').then(function () {

			var responded = false;

			please(childFrame.contentWindow).get('testVariable').then(function (value) {
				var responded = true;
			});

			setTimeout(function () {

				please(childFrame.contentWindow).get('teardownSourceOriginTest').then(function (value) {

					ok(!responded, "did not respond to request from invalid origin");

					please(childFrame.contentWindow).get('testVariable').then(function (value) {
						responded = true;
					});

					setTimeout(function () {
						ok(responded, "responded to request from valid origin");
						start();
					}, 50);

				});

			}, 50);

		});

	});

});


module('please.get');

asyncTest('Getting a variable\'s value from child', function () {
	var childFrame = $('#child-frame').get(0);
	
	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).get('testVariable').then(function (value) {
			equal('test', value, 'testVariable in child equals "test"');
			start();
		});

	});
});

asyncTest('Getting an object\'s property from child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).get('testObject.property').then(function (value) {
			equal('test', value, 'testObject.property in child equals "test"');
			start();
		});

	});
});

asyncTest('Getting an undefined variable from child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).get('undefinedVariable').then(function (value) {
			equal(value, undefined, 'undefinedVariable in child equals undefined');
			start();
		}, function (error) {
			ok(0, "Error occured while accessing an undefined variable");
			start();
		});

	});
});

asyncTest('Getting an undefined object\'s property from child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).get('undefinedObject.property').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while accessing an undefined object's property");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "Can not get 'property' of 'undefinedObject', because path element 'window.undefinedObject' is null or undefined", "Message is: Can not get 'property' of 'undefinedObject', because path element 'window.undefinedObject' is null or undefined");
			ok(1, error.stack);
			start();
		});

	});
});

asyncTest('Getting an undefined object\'s property from child with nested undefined path', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).get('defined.undefinedObject.property').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while accessing an undefined object's property");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "Can not get 'property' of 'defined.undefinedObject', because path element 'window.defined.undefinedObject' is null or undefined", "Message is: Can not get 'property' of 'defined.undefinedObject', because path element 'window.defined.undefinedObject' is null or undefined");
			ok(1, error.stack);
			start();
		});

	});
});

module('please.set');
asyncTest('Setting a global variable in child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).set('someVariable', 'someValue').then(function () {
			ok(1, "Variable set in child");
			return please(childFrame.contentWindow).get('someVariable');
		}).then(function (value) {
			equal(value, 'someValue', 'Verifying: "someVariable" in child set to "someValue"');
			start();
		});
	});
});

asyncTest('Setting an object\'s property in child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).set('testObject.someProperty', 'someValue').then(function () {
			ok(1, "testObject's property set in child");
			return please(childFrame.contentWindow).get('testObject.someProperty');
		}).then(function (value) {
			equal(value, 'someValue', 'Verifying: "testObject.someProperty" in child set to "someValue"');
			start();
		});

	});
});

asyncTest('Setting a property on an undefined object', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).set('undefinedObject.property', 'someValue').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while accessing an undefined object's property");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "Can not set 'property' on 'undefinedObject', because path element 'window.undefinedObject' is null or undefined", "Message is: Can not set 'property' on 'undefinedObject', because path element 'window.undefinedObject' is null or undefined");
			ok(1, error.stack);
			start();
		});

	});
});

asyncTest('Setting a property on an undefined object in a nested path', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).set('defined.undefinedObject.property', 'someValue').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while accessing an undefined object's property");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "Can not set 'property' on 'defined.undefinedObject', because path element 'window.defined.undefinedObject' is null or undefined", "Message is: Can not set 'property' on 'defined.undefinedObject', because path element 'window.defined.undefinedObject' is null or undefined");
			ok(1, error.stack);
			start();
		});

	});
});

module('please.call');
asyncTest('Calling a function in child', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('giveMeAnApple').then(function (apple) {
			equal(apple, 'apple', 'Called function "giveMeAnApple" in child returned value "apple"');
			start();
		});

	});
});

asyncTest('Calling a function with a parameter', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('giveMeApples', 5).then(function (apples) {
			deepEqual(apples, {apples: 5}, 'Called function giveMeApples with param N in child returned value {apple: N}');
			start();
		});
	});
});

asyncTest('Calling a function with an undefined parameter', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('echoFunction', undefined).then(function (echo) {
			deepEqual(echo, [null], 'Called function echoFunction with undefined param should return a null param');
			start();
		});
	});
});

asyncTest('Calling a method on an object', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('testObject.method').then(function (value) {
			equal(value, 'test', 'Calling testObject.method returned "test"');
			start();
		});

	});
});

asyncTest('Calling an undefined function', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('undefinedFunction').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while calling an undefined function.");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "'undefinedFunction' is not a function", "Message is: 'undefinedFunction' is not a function");
			ok(1, error.stack);
			start();
		});

	});
});

asyncTest('Calling an undefined method on an object', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('testObject.undefinedMethod').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while calling an undefined function.");
			equal(error.name, 'TypeError', 'Error is a TypeError');
			equal(error.message, "'testObject.undefinedMethod' is not a function", "Message is: 'testObject.undefinedMethod' is not a function");
			ok(1, error.stack);
			start();
		});

	});
});

asyncTest('Calling an erroneous function', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('errorFunction').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while accessing an undefined object's property");
			equal(error.message, "something went deliberately wrong", "Message is: something went deliberately wrong");
			ok(1, error.stack);

			start();
		});

	});
});

asyncTest('Calling a function with resolved promise return', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('keepPromise').then(function (ret) {
			equal(ret, 'fulfilled', 'Called function "keepPromise" in child returned value "fulfilled"');
			start();
		});

	});
});

asyncTest('Calling a function with rejected promise return', function () {
	var childFrame = $('#child-frame').get(0);

	runTestOnIframeLoad(function () {

		please(childFrame.contentWindow).call('letMeDown').then(function () {
			ok(0, "No error occured.");
		}, function (error) {
			ok(error instanceof please.Error, "Error occured while resolving promise");
			equal(error.error, 'sorry', 'Called function "letMeDown" in child returned value "sorry"');
			start();
		});

	});
});

function runTestOnIframeLoad (cb) {
	$('#child-frame').load(function () {
		cb();
	});
}

QUnit.start();
