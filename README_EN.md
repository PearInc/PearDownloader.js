<h1 align="center">
  <img src="fig/pear.png" height="110"></img>
  <br>
  <a href="http://demo.webrtc.win/downloader">PearDownloader.js</a>
  <br>
  <br>
</h1>

<h4 align="center">A multi-protocol, multi-source and P2P-CDN supporting Downloader</h4>
<br>

**PearDownloader** is an open soure downloader written in JavaScript, combine HTTP (including HTTPS, HTTP2) and WebRTC. It supports multi-protocol, multi-source, and achieves low latency and high bandwidth utilization. With well designed algorithms, PearDownloader can guarantee high P2P rate as well as download speed. 

![multisources](fig/fogvdn_multisources.png)

`pear-downloader.min.js` can be imported with the html label`<script>`, refer to  [code example](#使用方法), also [`/examples/download.html`](/examples/download.html) can help you. 

To know more information [API document](docs/get-started.md).<br/>

### Feature

- P2P based on **WebRTC**, no plug in
- **Speed up**, reliable
- Multi-protocol (HTTP, HTTPS, WebRTC), multi-source
- No parameter
- Saves data usage
- Supports all well-known browsers
- Supports [Pear Fog CDN](https://github.com/PearInc/FogVDN)
- Encoded with TLS/DTLS, no DPI feature; Pear Fog dynamic port mapping
<br>
Demo: https://demo.webrtc.win/pear/downloader/


## Quick Start

### Import the js packet
use script label to import pear-downloader.min.js：
```html
<script src="./dist/pear-downloader.min.js"></script>
```
or

```html
<script src="https://cdn.jsdelivr.net/npm/peardownloader@latest/dist/pear-downloader.min.js"></script>
```
suppose we want to download（/tv/pear001.mp4）
```html
<script>
/**
 * first parameter is the file's URL
 * opts is optional parameter
 */
var downloader = new PearDownloader('/tv/pear001.mp4', opts);
</script>
```
Congratulations! You can use the PearDownloader now!

### Who is using Pear Downloader today?

+ [Pear Limited](https://pear.hk)
+ [Lenovo China](https://www.lenovo.com.cn/)
+ [Newifi xCloud](http://www.newifi.com/)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)

### Pear Downloader document
- **[get-started](docs/get-started.md)**
- **[API](docs/api.md)**

### Thanks


- [WebTorrent](https://github.com/webtorrent/webtorrent)
- [Peer5](https://www.peer5.com/#)

###  Talks

- 2017.08.18 (IT Talks) - [WebRTC会成主流吗？众包CDN时代到了！](http://mp.weixin.qq.com/s/cx_ljl2sexE0XkgliZfnmQ)
- 2017.07.11 (OSChina) - [PearPlayer.js —— 混合P2P-CDN的流媒体播放器](https://www.oschina.net/p/PearPlayerjs)
- 2017.06.24 (Tencent Frontend Conference] - [基于WebRTC的P2P-CDN流媒体加速](http://www.itdks.com/dakalive/detail/2577)
- 2017.05.17 (SUSTech) - Edge Computing and Shared Fog Streaming
- 2017.05.08 (FCU) - A Cooler Fruit Venture: Scaling up a Network from Cloud to Fog with Crowdsourcing
- 2016.08.17 (HKUST) - From Cloud to Fog: Scaling up a Network with Crowdsourcing

### License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [snowinszu](https://github.com/snowinszu).

### Service
E-mail: <service@pear.hk>; QQ group：`373594967`; [Business](https://github.com/PearInc/FogVDN)
