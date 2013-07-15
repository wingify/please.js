# please.js 

please.js is a Request/Response based wrapper around the PostMessage API that makes use of jQuery Promises. Ever faced trouble communicating between two frames on different domains? Trouble not, just say please!

Here's a quick example to load an iframe window's location.
```javascript
var frameWindow = $('iframe').get(0).contentWindow;

please(frameWindow).call('window.location.reload');
```


Here's another one that fetches you the child document's height:
```javascript
var frameWindow = $('iframe').get(0).contentWindow;

please(frameWindow).get('document.height').then(function (height) {
   console.log('child document\'s height:', height);
});
```

Note: If you are using the above code on parent's document.onready function, it needs to be wrapped in frame.onload event.

```javascript
$(document).ready(function () {
   var $frame = $('iframe');
   $frame.load(function () {
      var frameWindow = $frame.get(0).contentWindow;
      please(frameWindow).get('document.height').then(function (height) {
         console.log('child document\'s height:', height);
      });
   });
})
```

## Downloads

  * [Development version](https://github.com/wingify/please.js/blob/master/please.js) *Uncompressed with Comments 15kb*
  * [Production version](https://github.com/wingify/please.js/blob/master/please.min.js) *Minified 5kb*

## Documentation

### Setting up

please.js is based on top of jQuery and the jQuery Promise API. jQuery version 1.6 or above is preferred. To make the communication between two windows on different domains work, both of them must be injected with the same version of jQuery and please.js.

### The please global object

Getting started with please.js is easy:

* Initialize please. In both the windows (frames), add the below code:

```javascript
please.init(window);
```

Before initialization however, you must make sure that both the current window and the  target window have please.js loaded and initialized.

<!-- todo: add handshake code for please.js -->

* Set the default `targetWindow` (recipient). Especially useful if the communication is needed only between two frames.

```javascript
please.defaults({
    // reference to the window to send messages to
    targetWindow: otherWindow,
    
    // what the target window's origin must be for the communication to facilitate
    targetOrigin: otherWindowOrigin 
});
```

* To send a message to the `targetWindow` set using `defaults`, just call the methods on the `please` global object.

```javascript
please.call('window.location.reload');
```
```javascript
please.get('window.location.href').then(function (href) {
    // use href variable here
});
```

* If you need to send a message to a `targetWindow` other than the one set using `defaults`, you could use please as a function and provide `targetWindow` and `targetOrigin` as parameters

```javascript
// navigate the parent window away to some other url.
// works only if the parent window is on *.example.com
please(parent, '*.example.com').set('window.location.href', 'http://www.google.com');
```

### please methods

**defaults** `please.defaults( objectHash )`

Sets the default `targetWindow` to send message to, and the `targetOrigin` of that window.
```javascript
please.defaults({
    // reference to the window to send messages to
    targetWindow: $('iframe').get(0).contentWindow,
    
    // what the target window's origin must be for the communication to facilitate
    targetOrigin: '*.example.com'
});
```

**call** `please.call( functionName, [args...] )`

Invokes a function `functionName` in the other window. Pass any arguments needed after the `functionName`. Returns a jQuery promise object. After the function is invoked in the other frame, the promise is resolved to the return value of the function. For example:

```javascript
// in the parent frame, have this code:
function sayHello () {
    return 'Hello from parent frame.';
}
```
```javascript
// and in the child frame:
please(parent).call('sayHello').then(function (helloString) {
    console.log('Parent said:', helloString);
})
```

You could also call a method on another object. Just pass the object name in the `functionName` as well like `object.someMethod`. For example:

```javascript
// in the parent frame:
var SomeObject = {
    someMethod: function () {
        return 'someMethod says hello!';
    }
};
```
```javascript
// and in the child frame:
please(parent).call('SomeObject.someMethod').then(function (helloString) {
    console.log('SomeObject.someMethod said:', helloString);
});
```

If you try to call a function that isn't defined, an error is thrown in the other frame and the error object is passed on to the source window. You can catch the error in the `failCallback` of the `then` method.

```javascript
please(parent).call('someUndefinedFunction').then(function (retval) { // success callback
    // this will never execute
    console.log('response recieved from the parent frame.');
}, function (error) { // failure callback
    console.log('error occured: ', error.stack);
});
```
The `failCallback` will also be called even if the function executed in the other frame throws an error.
```javascript
// in the parent frame:
function errorProneFunction () {
    throw new Error('Something went wrong!');
}
```
```javascript
// in the child frame:
please(parent).call('errorProneFunction').then(function (retval) { // success callback
    // this will never execute
    console.log('function returned with value:', retval);
}, function (error) {
    console.log('error:', error.message); // Something went wrong!
});
```

**set** `please.set( propertyName, propertyValue )`

Sets a global variable or a property on an object in the other window. Returns a jQuery promise object. After the property is set, the promise object is resolved.

```javascript
var someIframeWindow = $('iframe').get(0).contentWindow
please(someIframeWindow).set('someVariable', 'foo').then(function () {
    // execute some code
    please(someIframeWindow).get('someVariable').then(function (someVariable) {
        console.log('someVariable:', someVariable);
    });
});
```
Note: jQuery 1.8+ supports chaining then callbacks by returning promise objects. For 1.8 and above versions, the above code can be simplified like:

```javascript
var someIframeWindow = $('iframe').get(0).contentWindow
please(someIframeWindow).set('someVariable', 'foo').then(function () {
    return please(someIframeWindow).get('someVariable')
}).then(function (someVariable) {
    console.log('someVariable:', someVariable);
});;
```

However, since all postmessage requests are sent in a linear order, and responses are received in the same order, a race condition would be impossible in this case. So calling both requests synchronously would also work:

```javascript
var someIframeWindow = $('iframe').get(0).contentWindow
please(someIframeWindow).set('someVariable', 'foo');
please(someIframeWindow).get('someVariable').then(function (someVariable) {
    console.log('someVariable:', someVariable);
});;
```

**get** `please.get( propertyName )`

Gets a value of a global variable or a property on an object in the other window. Returns a jQuery promise object that resolves with the value of the property requested.

```javascript
please(parent).get('document.height', function (documentHeight) {
   console.log('parent document\'s height:', documentHeight);
});
```

If the variable or property is not defined, it returns `undefined`.
```javascript
please(parent).get('someUndefinedProperty').then(function (propertyValue) {
    console.log('value of the property: ', propertyValue); // undefined
});
```

If the property is requested on an object that is undefined, an error is thrown in the other frame and the promise object fails to resolve. You can catch the error in the `failCallback` of the `then` method, just like the `please.call` method above.

```javascript
var otherFrame = $('iframe').get(0).contentWindow;
please(otherWindow).get('undef.blahBlah', function (propertyValue) { // success callback
    // this never gets executed
    console.log('value of the property: ', propertyValue);
}, function (error) { // faliure callback
    console.log('an error occured')
});
```

## Roadmap

* Add support for communication in Chrome Extensions.
* Add support for making please function accept a jQuery selector.
* Document please.$ and improve its functionality.

## License

The MIT License

Copyright (c) 2013 Wingify Software Pvt. Ltd.
