# Get Started with PearDownloader

**PearDownloader** is a multi-source and multi-protocol P2P streaming downloader that works in the **browser**. It's easy
to get started!

## Import
### Script
Simply include the
([`pear-downloader.min.js`](dist/pear-downloader.min.js))
script on your page:
```html
<script src="pear-downloader.min.js"></script>
```

### Browserify
To install PearPlayer for use in the browser with `require('PearDownloader')`, run:
```bash
npm install peardownloader --save
```
Then you can require PearDownloader like this:
```js
var PearDownloader = require('PearDownloader');
```

## Quick Examples

### input url and download

```js
var PearDownloader = require('PearDownloader');
var downloader = new PearDownloader(url);
```

There is a complete example in [examples/downloader-test.html](../examples/downloader-test.html)。

### Listen to PearDownloader events

```js
var downloader = new PearDownloader(url, {      //第一个参数为url
                    useMonitor: true             //是否开启monitor,会稍微影响性能,默认false
                });

downloader.on('exception', onException);
downloader.on('begin', onBegin);
downloader.on('progress', onProgress);
downloader.on('sourcemap', onSourceMap);        
downloader.on('done', onDone);
                
function onBegin(fileLength, chunks) {
    console.log('start downloading buffer by first aid, file length is:' + fileLength + ' total chunks:' + chunks);
}

function onProgress(downloaded) {
    console.log('Progress: ' + (downloaded * 100).toFixed(1) + '%');
}

function onDone() {
    console.log('finished downloading buffer by first aid');
}

function onException(exception) {
    var errCode = exception.errCode;
    switch (errCode) {
        case 1:                   //当前浏览器不支持WebRTC
        console.log(exception.errMsg);
            break
    }
}
function onSourceMap(sourceType, index) {
        console.log('Received source type:' + sourceType + ' index:' + index);
    }
```

## Build

PearDownloader works great with [browserify](http://browserify.org/), which lets
you use [node.js](http://nodejs.org/) style `require()` to organize your browser
code, and load packages installed by [npm](https://npmjs.org/).

```bash
npm install -g browserify
```
Install dependencies:
```bash
npm install
```
To get a normal size bundle,use:
```bash
npm run build-downloader
```
To get a compressed bundle,use:
```bash
npm run uglify-downloader
```

## More Documentation

Check out the [API Documentation](https://github.com/PearInc/PearDownloader.js/blob/master/docs/api.md)
and [FAQ](https://github.com/PearInc/PearDownloader.js/blob/master/docs/faq.md) for more details.
