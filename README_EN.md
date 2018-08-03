<h1 align="center">
  <img src="fig/pear.png" height="110"></img>
  <br>
  <a href="http://demo.webrtc.win/downloader">PearDownloader.js</a>
  <br>
  <br>
</h1>

<h4 align="center">A multi-protocol, multi-source and hybrid P2P-CDN downloader </h4>
<br>

The release of [PearPlayer.js](https://github.com/PearInc/PearPlayer.js) has attracted constant attention from industry and we have received many precious suggestions. On the one hand, we will continue maintaining and updating PearPlayer to support more extended functions. On the other hand, we will rearrange the related module that is of deeper layer, more flexible and applicable to wider areas. Besides, focused on node selection and data scheduling, we separate out multi-source transmission parts and thus form PearDownloader.js.

PearDownloader (梨享下载器) **[[Demo](http://demo.webrtc.win/)]**, serving as base download module of the [PearPlayer](https://github.com/PearInc/PearPlayer.js), combines HTTP (including HTTPS, HTTP2) & WebRTC and accelarates the streaming media on Web. It supports multiple protocols, multiple sources, and achieves low latency and high bandwidth utilization. Our customized algorithms, based on high efficiency, can integrate data from multi nodes to form a complete file or transfer well-organised data/media stream to upper layer applications like audio & video players. Thus, PearDownloader can ensure the downloading speed while maximizing the P2P ratio at the same time.
 
 
PearDownloader aims to lower the migration cost for Content Providers (CP) of the present well-developed players: CP manufacturers can choose to integrate it into their own products and achieve Web P2P ability. They can also schedule the massive node sources of [Pear Fog](https://github.com/PearInc) to enjoy low-cost, high-quality shared fog CDN service. PearDownloader supports more kinds of file types, provides more flexible scheduling algorithm & strategies and satisfies broader and more flexible business situations and needs.

<p align="center">
<a href="https://www.npmjs.com/package/peardownloader"><img src="./fig/player-arch.png" alt="arch"></a>
</p>

Simply import `pear-downloader.min.js` to HTML via `<script>` tag. Refer to [code example](#usages) or consult [`/examples/downloader-test.html`](/examples/downloader-test.html) or [get-started](docs/get-started.md) for usages.<br/>


## Features

- Client- and plugin-free thanks to P2P ability based on WebRTC
- Multi-protocol (HTTP, HTTPS, WebRTC), multi-source
- Support the present mainstream browsers thanks to the multi-source transmission ability (Fully schedule HTTP nodes when browser does not support WebRTC.)
- Support simultaneously playing and downloading of audios & videos using MSE within the browser kernel
- Customized algorithms ensure the downloading speed while maximizing the P2P ratio at the same time. (Users can also adopt their own algorithms to fulfill various situation needs.)
- Parameter-free by default (dynamic adaptive internally according to bitrate, etc.). Clients can fill in their preferred parameters in advanced mode.
- Optional access to low-cost, high-availability Pear [Fog CDN](https://github.com/PearInc/FogVDN)
- Fully encrypted via TLS/DTLS by default, no DPI features; Statistical characteristics can be further eliminated using dynamic port mapping of Pear Fog Suite.
- With Browser-to-Browser P2P ability (based on WebTorrent)
 

## Usages

First, use script tag to import pear-downloader.min.js：
```html
<script src="./dist/pear-downloader.min.js"></script>
```
or use CDN
```html
<script src="https://cdn.jsdelivr.net/npm/peardownloader@latest"></script></script>
```
If we want to download https://example.com/file.zip
```html
<script>
  var downloader = new PearDownloader('https://example.com/file.zip');
</script>
```

### How to accelerate your files?
The file above has already been dispatched. So how to speed up other files? It's a piece of cake. Just add your file URL into [File distribution system](https://oss.webrtc.win/). And then you can feel free to use Pear's massive nodes to accelerate your file downloading! Please click [here](https://manual.webrtc.win/oss/) for detailed guide. (You need to add `Pear-Demo` prefix in front of the file name, such as `Pear-Demo-file.zip`)


### Who's using PearDownloader today?

+ [Pear Limited](https://pear.hk)
+ [Lenovo China](https://www.lenovo.com.cn/)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)
+ [Tencent APD](http://www.chinaz.com/news/2016/0707/548873.shtml)

### PearDownloader Documents
- **[get-started](docs/get-started.md)**
- **[API](docs/api.md)**

### Acknowledgement
Special thanks goes to the following projects that provide some inspirations and API design references:

- [WebTorrent](https://github.com/webtorrent/webtorrent)
- [Peer5](https://www.peer5.com/#)

###  Talks

- Feb 7th, 2018 (36Kr) - [「Pear Share」practises fog computing, behind millions of fringe nodes are efficiency promotion and cost control](http://36kr.com/p/5118296.html) 
- Sep 1st, 2017 (Future Network and Open Community Alliance) - [Fog Computing rises after Cloud Computing - Have a discuss on P2P-CDN]
- Aug 18, 2017 (IT Biggie Talks) - [Will WebRTC be the mainstream? Here comes the era of CDN crowdsourcing!](http://mp.weixin.qq.com/s/cx_ljl2sexE0XkgliZfnmQ)
- Jul 11st, 2017 (OSChina) - [PearPlayer.js - A streaming media player supports Mixed P2P-CDN](https://www.oschina.net/p/PearPlayerjs)
- Jun 24th, 2017 (Tencent Frontend Conference) - [P2P-CDN streaming media acceleration based on WebRTC](http://www.itdks.com/dakalive/detail/2577)
- May 17th, 2017 (Southern University of Science and Technology) - Edge Computing and Shared Fog Streaming
- May 8th, 2017 (Feng Chia University) - A Cooler Fruit Venture: Scaling up a Network from Cloud to Fog with Crowdsourcing
- Aug 17th, 2016 (Hong Kong University of Science and Technology) - From Cloud to Fog: Scaling up a Network with Crowdsourcing

### License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [snowinszu](https://github.com/snowinszu).

### Help and Support
E-mail: <service@pear.hk>; QQ Group: `373594967`; [CP/CDN, OEM and other business cooperations](https://github.com/PearInc/FogVDN)
