
<h1 align="center">
  <img src="fig/pear.png" height="220"></img>
  <br>
  PearDownloader.js
  <br>
  <br>
</h1>

<h4 align="center">一个支持多协议、多源、混合P2P-CDN的下载器</h4>
<p align="center">
 <a href="https://www.npmjs.com/package/peardownloader"><img src="https://img.shields.io/badge/build-passing-green.svg" alt="npm"></a>
  <a href="https://www.npmjs.com/package/peardownloader"><img src="https://img.shields.io/badge/npm-v1.0.0-blue.svg" alt="npm"></a>
   <a href="https://www.jsdelivr.com/package/npm/peardownloader"><img src="https://data.jsdelivr.com/v1/package/npm/peardownloader/badge" alt="jsdelivr"></a>
 <a href="https://www.jsdelivr.com/package/npm/peardownloader"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>
<br>

PearPlayer 发布后，吸引了大家持续的关注，同时我们也收集到了大家许多宝贵的建议。
一方面我们将持续维护更新PearPlayer，使其支持更多的拓展功能；
另一方面我们将更底层、更基础的且适用范围更广的相关组件重新整理，专注于节点的选择以及数据的调度，将多源传输部分剥离出来，形成PearDownloader。
PearDownloader的发布，可以弥补PearPlayer对于已有成熟播放器集成的不足，内容提供商可以按需将其集成到自有产品中，使用PearFog服务。
PearDownloader支持更多样化的文件类型，更灵活的调度算法、调度策略的选择，满足更广阔、灵活、多变的业务场景与业务需求。

**PearDownloader（梨享下载器）** 是[PearPlayer](https://github.com/PearInc/PearPlayer.js)的底层下载模块，
实现了融合HTTP（包含HTTPS、HTTP2）、WebRTC的多协议、多源、低延迟、高带宽利用率的无插件Web端下载加速能力。
基于高效的调度算法将来自多个节点的数据进行拼接形成完整的文件或将有序的数据/媒体流喂给上层的应用，例如音视频播放器，
PearDownloader能在保证下载速度前提下最大化P2P率。

![multisources](fig/player-arch.png)

只需将`pear-downloader.min.js`通过`<script>`标签导入到HTML就可以使用。 
参考以下[代码示例](#使用方法)，也可以查看[`/examples/downloader-test.html`](/examples/downloader-test.html)来了解使用方法。

参考[get-started](docs/get-started.md)来了解基本使用方法。<br/>

### 特性

- P2P能力基于**WebRTC**，无须安装任何插件
- **下载快速**，严格测试，稳定可靠
- 多协议(HTTP、HTTPS、WebRTC)、多源
- 自行研发的调度算法，在保证下载速度的前提下最大化P2P率
- 默认无需填参数（内部根据文件属性作自适应），高级使用模式可自行调整算法和参数
- 支持Chrome、Firefox、Opera等主流浏览器，不久将支持腾讯微信、X5/TBS、Safari11
- 可选接入低成本、高可用性的Pear [FogVDN](https://github.com/PearInc/FogVDN)
- 协议默认通过TLS/DTLS全加密，无DPI特征；并可通过Pear Fog组件的动态端口映射进一步消除统计学特征
- 目前已实现Browser P2P能力（基于WebTorrent）
<br>
Demo演示地址：https://demo.webrtc.win/peardownloader/


## 使用方法

首先通过script标签导入pear-downloader.min.js：
```html
<script src="./dist/pear-downloader.min.js"></script>
```
或者使用CDN：
```html
<script src="https://cdn.jsdelivr.net/npm/peardownloader@latest/dist/pear-downloader.min.js"></script>
```
假设要下载https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4
```html
<script>
/**
 * 第一个参数为文件的url
 * opts是可选的参数配置
 */
var downloader = new PearDownloader('https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4', opts);
</script>
```
恭喜您，您的下载器已经具备P2P能力了，而且无须任何插件！

### 谁在用我们的产品？

+ [Pear Limited](https://pear.hk)
+ [Lenovo China](https://www.lenovo.com.cn/)
+ [Newifi xCloud](http://www.newifi.com/)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)

### PearDownloader文档
- **[阅读get-started文档](docs/get-started.md)**
- **[阅读API文档](docs/api.md)**

### 致谢
特别感谢以下项目，为本项目提供了部分灵感来源以及API设计参考：

- [WebTorrent](https://github.com/webtorrent/webtorrent)
- [Peer5](https://www.peer5.com/#)

### 演讲与媒体报道

- 2017.08.18  （IT大咖说） - [WebRTC会成主流吗？众包CDN时代到了！](http://mp.weixin.qq.com/s/cx_ljl2sexE0XkgliZfnmQ)
- 2017.07.11 （OSChina开源中国） - [PearPlayer.js —— 混合P2P-CDN的流媒体播放器](https://www.oschina.net/p/PearPlayerjs)
- 2017.06.24 （腾讯Web前端大会） - [基于WebRTC的P2P-CDN流媒体加速](http://www.itdks.com/dakashuo/new/dakalive/detail/2577)
- 2017.05.17 （南方科技大学） - Edge Computing and Shared Fog Streaming
- 2017.05.08 （台湾逢甲大学） - A Cooler Fruit Venture: Scaling up a Network from Cloud to Fog with Crowdsourcing
- 2016.08.17 （香港科技大学） - From Cloud to Fog: Scaling up a Network with Crowdsourcing

### License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [snowinszu](https://github.com/snowinszu).

### 帮助与支持
E-mail: <service@pear.hk>；用户QQ群：`373594967`；[CP/CDN接入、OEM与其他商务合作](https://github.com/PearInc/FogVDN)
