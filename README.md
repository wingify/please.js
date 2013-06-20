# please.js 

please.js is a Request/Response based wrapper around the PostMessage API that makes use of jQuery Promises. Ever faced trouble communicating between two frames on different domains? Trouble not, just say please!

Here's a quick example to load an iframe window's location.
```javascript
var frame = $('iframe').get(0).contentWindow;

please(frame).call('window.location.reload');
```


Here's another one that fetches you the child document's height:
```javascript
var frame = $('iframe').get(0).contentWindow;

please(frame).get('document.height').then(function (height) {
   console.log('child document\'s height:', height);
});
```

## Downloads

  * [Development version](https://github.com/wingify/please.js/blob/master/please.js) *Uncompressed with Comments 12kb*
  * Production version *(Coming Soon)*

## Prerequisites

please.js is based on top of jQuery and the jQuery Promise API. jQuery version 1.6 or above is preferred. To make the communication between two windows on different domains work, both of them must be injected with the same version of jQuery and please.js.

## Usage

Coming soon...

## Changelog

Coming soon...

## License

The MIT License

Copyright (c) 2013 Wingify Software Pvt. Ltd.
