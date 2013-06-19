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

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
