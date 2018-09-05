/**
 * Created by xieting on 2017/11/9.
 */

module.exports = Worker;

var debug = require('debug')('pear:worker');
var md5 = require('blueimp-md5');
var Dispatcher = require('./dispatcher');
var HttpDownloader = require('./http-downloader');
var RTCDownloader = require('./webrtc-downloader-bin');
var getPeerId = require('./peerid-generator');
var url = require('url');
var File = require('./file');
var nodeFilter = require('./node-filter');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var Set = require('./set');
var PearTorrent = require('./pear-torrent');
var Scheduler = require('./node-scheduler');
var Reporter = require('./reporter');

var PieceValidator = require('./piece-validator');

// var WEBSOCKET_ADDR = 'ws://signal.webrtc.win:9600/ws';             //test
var WEBSOCKET_ADDR = 'wss://signal.webrtc.win:7601/wss';
var GETNODES_ADDR = 'https://api.webrtc.win/v1/customer/nodes';

var BLOCK_LENGTH = 32 * 1024;

inherits(Worker, EventEmitter);

function Worker(urlStr, token, opts) {
    var self = this;

    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return Worker(urlStr, '', token);
    EventEmitter.call(self);
    opts = opts || {};
    // token = '';
    // if (typeof token !== 'string') throw new Error('token must be a string!');
    // if (!(opts.type && opts.type === 'mp4')) throw new Error('only mp4 is supported!');
    // if (!((opts.src && typeof opts.src === 'string') || self.video.src)) throw new Error('video src is not valid!');
    // if (!(config.token && typeof config.token === 'string')) throw new Error('token is not valid!');

    //player
    self.render = opts.render;
    self.selector = opts.selector;
    self.autoplay = opts.autoplay === false ? false : true;

    self.src = urlStr;
    self.urlObj = url.parse(self.src);
    self.scheduler = opts.scheduler || 'IdleFirst';
    self.token = token;
    self.useDataChannel = (opts.useDataChannel === false)? false : true;
    self.useMonitor = (opts.useMonitor === false)? false : true;
    self.useTorrent = (opts.useTorrent === false)? false : true;
    self.magnetURI = opts.magnetURI || undefined;
    self.trackers = opts.trackers && Array.isArray(opts.trackers) && opts.trackers.length > 0 ? opts.trackers : null;
    self.sources = opts.sources && Array.isArray(opts.sources) && opts.sources.length > 0 ? opts.sources : null;
    self.auto = (opts.auto === false) ? false : true;
    self.dataChannels = opts.dataChannels || 20;
    self.peerId = getPeerId();
    self.isPlaying = false;
    self.fileLength = 0;
    self.nodes = [];
    self.websocket = null;
    self.dispatcher = null;
    self.JDMap = {};                           //根据dc的peer_id来获取jd的map
    self.nodeSet = new Set();                  //保存node的set
    self.tempDCQueue = [];                     //暂时保存data channel的队列
    self.fileName = self.urlObj.path.split('/').pop();
    self.file = null;
    self.dispatcherConfig = {

        chunkSize: opts.chunkSize && (opts.chunkSize%BLOCK_LENGTH === 0 ? opts.chunkSize : Math.ceil(opts.chunkSize/BLOCK_LENGTH)*BLOCK_LENGTH),   //每个chunk的大小,默认1M
        interval: opts.interval ? opts.interval : (opts.sequencial ? 5000 : 2000),                                 //滑动窗口的时间间隔,单位毫秒,默认10s,
        auto: self.auto,
        useMonitor: self.useMonitor,
        scheduler: Scheduler[self.scheduler],
        sequencial: opts.sequencial,
        maxLoaders: opts.maxLoaders || 10,
        algorithm: opts.algorithm  || 'push'            // push or pull
    };

    if (self.useDataChannel) {
        self._pearSignalHandshake();
    }
    //candidate
    self.candidateMap = {};

    //info
    self.connectedDC = 0;
    self.usefulDC = 0;

    self._debugInfo = {
        totalDCs: 0,
        connectedDCs: 0,
        usefulDCs: 0,
        totalHTTP: 0,
        totalHTTPS: 0,
        usefulHTTPAndHTTPS: 0,
        windowOffset: 0,
        windowLength: 0,
        signalServerConnected: false,
        traffics: {},
        abilities: {}
    };

    self._start();
}

Worker.isRTCSupported = function () {

    return !!getBrowserRTC();
}

Object.defineProperty(Worker.prototype, 'debugInfo', {
    get: function () { return this._debugInfo }
});



Worker.prototype._start = function () {
    var self = this;
    if (!window.WebSocket) {
        self.useDataChannel = false;
    }

    if (self.sources) {                     //如果用户指定下载源

        self.sources = self.sources.map(function (source) {

            return {uri: source, type: 'server'};
        });
        nodeFilter(self.sources, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小

            var length = nodes.length;
            debug('nodes:'+JSON.stringify(nodes));

            if (length) {
                // self.fileLength = fileLength;
                debug('nodeFilter fileLength:'+fileLength);

                if (self.auto) {
                    self._startPlaying(nodes);
                } else {
                    self._initRangeLoader(nodes);
                }

            } else {

                self._fallBack();
            }
        }, {start: 0, end: 30});
    } else {

        self._getNodes(self.token, function (nodes) {
            debug('debug _getNodes: %j', nodes);
            if (nodes) {

                var xhr = new XMLHttpRequest();
                xhr.responseType = "arraybuffer";
                xhr.open("GET", self.torrentUrl);
                xhr.onload = function () {
                    var response = this.response;
                    // console.warn(response);
                    self.validator = new PieceValidator(response);

                    if (self.auto) {
                        self._startPlaying(nodes);
                    } else {
                        self._initRangeLoader(nodes);
                    }
                }
                xhr.send();


                // if (self.useDataChannel) {
                //     self._pearSignalHandshake();
                // }
            } else {
                self._fallBackToWRTC();
            }
        });
    }
};

Worker.prototype._fallBack = function () {

    debug('PearDownloader _fallBack');

    // 回源下载  添加者：gooni@pear.hk
    var aTag = document.createElement('a');
    aTag.download = this.fileName;
    aTag.href = this.src;
    aTag.click()
    
    this.emit('fallback');
};

Worker.prototype._fallBackToWRTC = function () {
    var self = this;
    debug('_fallBackToWRTC');
    if (self._debugInfo.signalServerConnected === true) {         //如果websocket已经连接上
        nodeFilter([{uri: self.src, type: 'server'}], function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小

            var length = nodes.length;
            if (length) {
                // self.fileLength = fileLength;
                debug('nodeFilter fileLength:'+fileLength);
                self.fileLength = fileLength;
                self._startPlaying(nodes);
            } else {

                self._fallBack();
            }
        });
    } else {
        self._fallBack();
    }

};

Worker.prototype._getNodes = function (token, cb) {
    var self = this;

    var postData = {
        client_ip:'116.77.208.118',
        host: self.urlObj.host,
        uri: self.urlObj.path
    };
    postData = (function(obj){
        var str = "?";

        for(var prop in obj){
            str += prop + "=" + obj[prop] + "&"
        }
        return str;
    })(postData);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", GETNODES_ADDR+postData);
    xhr.timeout = 2000;
    xhr.setRequestHeader('X-Pear-Token', self.token);
    xhr.ontimeout = function() {
        self._fallBack();
        cb(null);
    };
    xhr.onerror = function () {
        self._fallBackToWRTC();
    };
    xhr.onload = function () {
        if (this.status >= 200 && this.status < 300 || this.status == 304) {

            debug(this.response);

            var res = JSON.parse(this.response);
            // debug(res.nodes);
            if (res.size) {                         //如果filesize大于0
                self.fileLength = res.size;

                self.torrentUrl = res.torrents['512'];   //保存torrent地址

                // if (self.useDataChannel) {
                //     self._pearSignalHandshake();
                // }

                if (!res.nodes){                            //如果没有可用节点则切换到纯webrtc模式
                    // cb(null);
                    // cb([{uri: self.src, type: 'server'}]);
                    self._fallBackToWRTC();
                } else {

                    var nodes = res.nodes;
                    var allNodes = [];
                    var isLocationHTTP = location.protocol === 'http:' ? true : false;
                    var httpsCount = 0;
                    var httpCount = 0;
                    for (var i=0; i<nodes.length; ++i) {
                        var protocol = nodes[i].protocol;

                        if (protocol && protocol === 'webtorrent') {                                   //webtorrent
                            if (!self.magnetURI) {                     //如果用户没有指定magnetURI
                                self.magnetURI = nodes[i].magnet_uri;
                                debug('_getNodes magnetURI:'+nodes[i].magnet_uri);
                            }
                        } else {                                                                        //http/https
                            httpsCount ++;
                            httpCount ++;
                            protocol = isLocationHTTP ? 'http' : 'https';
                            var port = isLocationHTTP ? nodes[i].http_port : nodes[i].https_port;
                            var host = nodes[i].host + ':' + port;
                            var type = nodes[i].type;
                            var capacity = nodes[i].capacity;
                            var path = self.urlObj.host + self.urlObj.path;
                            var url = protocol+'://'+host+'/'+path;
                            if (!self.nodeSet.has(url)) {
                                allNodes.push({uri: url, type: type, capacity: capacity});
                                self.nodeSet.add(url);
                            }
                        }


                        // if (protocol === 'webtorrent') {
                        //     if (!self.magnetURI) {                     //如果用户没有指定magnetURI
                        //         self.magnetURI = nodes[i].magnet_uri;
                        //         debug('_getNodes magnetURI:'+nodes[i].magnet_uri);
                        //     }
                        // } else {
                        //     protocol === 'https' ? httpsCount++ : httpCount++;
                        //     if (isLocationHTTP || protocol !== 'http') {
                        //         var host = nodes[i].host;
                        //         var type = nodes[i].type;
                        //         var capacity = nodes[i].capacity;
                        //         var path = self.urlObj.host + self.urlObj.path;
                        //         var url = protocol+'://'+host+'/'+path;
                        //         if (!self.nodeSet.has(url)) {
                        //             allNodes.push({uri: url, type: type, capacity: capacity});
                        //             self.nodeSet.add(url);
                        //         }
                        //     }
                        // }
                    }

                    self._debugInfo.totalHTTPS = httpsCount;
                    self._debugInfo.totalHTTP = httpCount;

                    debug('allNodes:'+JSON.stringify(allNodes));
                    self.nodes = allNodes;
                    if (allNodes.length === 0) cb([{uri: self.src, type: 'server'}]);
                    nodeFilter(allNodes, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小
                        // nodes = [];                                            //test
                        var length = nodes.length;
                        debug('nodes:'+JSON.stringify(nodes));

                        self._debugInfo.usefulHTTPAndHTTPS = self._debugInfo.totalHTTPS;
                        if (length) {
                            // self.fileLength = fileLength;
                            // debug('nodeFilter fileLength:'+fileLength);
                            // self.nodes = nodes;
                            if (length <= 2) {
                                // fallBack(nodes[0]);
                                nodes.push({uri: self.src, type: 'server'});
                                cb(nodes);
                                // self._fallBack();           //test
                            } else if (nodes.length >= 20){
                                nodes = nodes.slice(0, 20);
                                cb(nodes);
                            } else {
                                cb(nodes);
                            }
                        } else {
                            // self._fallBack();
                            cb([{uri: self.src, type: 'server'}]);
                        }
                    }, {start: 0, end: 30});
                }
            } else {
                cb(null);
            }
        } else {                             //返回码不正常
            self._fallBack();
            cb(null);
        }
    };
    xhr.send();
};

Worker.prototype._pearSignalHandshake = function () {
    var self = this;
    var dcCount = 0;                            //目前建立的data channel数量
    debug('_pearSignalHandshake');
    var websocket = new WebSocket(WEBSOCKET_ADDR);
    self.websocket = websocket;
    websocket.onopen = function() {
        // debug('websocket connection opened!');
        self._debugInfo.signalServerConnected = true;
        var hash = md5(self.urlObj.host + self.urlObj.path);
        websocket.push(JSON.stringify({
            "action": "get",
            "peer_id": self.peerId,
            "host": self.urlObj.host,
            "uri": self.urlObj.path,
            "md5": hash
        }));
        // debug('peer_id:'+self.peerId);
    };
    websocket.push = websocket.send;
    websocket.send = function(data) {
        if (websocket.readyState != 1) {
            console.warn('websocket connection is not opened yet.');
            return setTimeout(function() {
                websocket.send(data);
            }, 1000);
        }
        // debug("send to signal is " + data);
        websocket.push(data);
    };
    websocket.onmessage = function(e) {
        var message = JSON.parse(e.data);
        // debug("[simpleRTC] websocket message is: " + JSON.stringify(message));
        // message = message.nodes[1];
        if (message.action === 'candidate' && message.candidates.type === 'end') {

            for (var peerId in self.candidateMap) {
                if (message.peer_id === peerId) {
                    // debug('self.candidateMap[peerId]:'+self.candidateMap[peerId]);
                    self.JDMap[peerId].candidatesFromWS(self.candidateMap[peerId]);
                }
            }
        } else if (message.nodes) {
            var nodes = message.nodes;

            self._debugInfo.totalDCs = nodes.length;

            for (var i=0;i<nodes.length;++i) {
                var offer = nodes[i];
                if (!offer.errorcode) {
                    if (dcCount === self.dataChannels) break;
                    // debug('dc message:'+JSON.stringify(offer));
                    if (!self.JDMap[offer.peer_id]) {
                        self.candidateMap[offer.peer_id] = makeCandidateArr(offer.sdp.sdp);

                        offer.sdp.sdp = offer.sdp.sdp.split('a=candidate')[0];
                        // debug('initDC:'+JSON.stringify(offer));
                        self.JDMap[offer.peer_id] = self.initDC(offer);

                        //test
                        // debug('self.candidateMap[node.peer_id]:'+JSON.stringify(self.candidateMap[node.peer_id]));
                        // self.JDMap[node.peer_id].candidatesFromWS(self.candidateMap[node.peer_id]);

                        dcCount ++;
                    } else {
                        debug('datachannel 重复');
                    }
                } else {
                    debug('dc error message:'+JSON.stringify(message))
                }
            }
        }
    };
    // websocket.onclose = function () {
    //     alert('websocket关闭');
    // }
};

Worker.prototype.initDC = function (offer) {
    var self = this;

    var dc_config = {
        peer_id: self.peerId,
        chunkSize: 32*1024,
        host: self.urlObj.host,
        uri: self.urlObj.path,
        useMonitor: self.useMonitor
    };

    var jd = new RTCDownloader(dc_config);
    jd.offerFromWS(offer)
    jd.on('signal',function (message) {
        // debug('[jd] signal:' + JSON.stringify(message));
        self.websocket.send(JSON.stringify(message));
    });
    jd.once('connect',function () {

        self._debugInfo.connectedDCs ++;
        self._debugInfo.usefulDCs ++;

        if (self.dispatcher) {
            self.dispatcher.addDataChannel(jd);
        } else {
            self.tempDCQueue.push(jd);
        }
    });

    return jd;
};

Worker.prototype._startPlaying = function (nodes) {
    var self = this;
    debug('start playing');
    self.dispatcherConfig.initialDownloaders = [];
    for (var i=0;i<nodes.length;++i) {
        var node = nodes[i];
        var hd = new HttpDownloader(node.uri, node.type);
        hd.on('error', self._fallBack());
        hd.id = i;                                                 //test
        self.dispatcherConfig.initialDownloaders.push(hd);
    }
    self.dispatcherConfig.fileSize = self.fileLength;
    // self.dispatcherConfig.sortedURIs = nodes;
    var fileConfig = {
        length: self.fileLength,
        offset: 0,
        name: self.urlObj.path,
        elem: self.selector
    };

    var d = new Dispatcher(self.dispatcherConfig);
    self.dispatcher = d;

    while (self.tempDCQueue.length) {
        var jd = self.tempDCQueue.shift();
        self.dispatcher.addDataChannel(jd);
    }

    //{errCode: 1, errMsg: 'This browser do not support WebRTC communication'}
    d.once('ready', function (chunks) {

        self.emit('begin', self.fileLength, chunks);

        //开始上报节点流量
        self.reportTrafficId = setInterval(function () {

            var traffics = [];
            var sourceObj = self._debugInfo.traffics;
            for (var mac in sourceObj) {
                traffics.push(sourceObj[mac]);
            }
            // console.warn('traffics:'+JSON.stringify(traffics));
            Reporter.reportTraffic(self.peerId, self.fileLength, traffics);
        }, 5000);

        //开始上报节点能力值
        self.reportAbilitiesId = setInterval(function () {

            Reporter.reportAbilities(self._debugInfo.abilities);
        }, 10000);

        // nodeFilter(self.nodes, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小
        //
        //     if (nodes.length) {
        //
        //         self._debugInfo.usefulHTTPAndHTTPS += nodes.length;
        //         nodes.map(function (item) {
        //
        //             var hd = new HttpDownloader(item.uri, item.type);
        //             d.addNode(hd);
        //         });
        //     }
        // }, {start: 30, end: 50});

        if (self.useTorrent && self.magnetURI) {
            var client = new PearTorrent();
            // client.on('error', function () {
            //
            // });
            debug('magnetURI:'+self.magnetURI);
            client.add(self.magnetURI, {
                    announce: self.trackers || [
                        "wss://tracker.openwebtorrent.com",
                        "wss://tracker.btorrent.xyz"
                    ],
                    store: d.store,
                    bitfield: d.bitfield,
                    strategy: 'rarest'
                },
                function (torrent) {
                    debug('Torrent:', torrent);

                    d.addTorrent(torrent);
                }
            );
        }
    });

    var file = new File(d, fileConfig);

    self.file = file;

    file._dispatcher._init();

    // debug('self.autoPlay:'+self.autoplay);

    if (self.render) {
        self.render.render(file, self.selector, {autoplay: self.autoplay});
    }

    self.isPlaying = true;

    d.on('error', function () {
        debug('dispatcher error!');
        // d.destroy();
        // self._fallBack();
        // var hd = new HttpDownloader(self.src, 'server');
        // // d.addNodes([{uri: self.src, type: 'server'}]);
        // d.addNode(hd);
    });

    d.on('needmorenodes', function () {
        debug('request more nodes');
        self._getNodes(self.token, function (nodes) {
            debug('needmorenodes _getNodes:'+JSON.stringify(nodes));
            if (nodes) {
                // d.addNodes(nodes);
                for (var i=0;i<nodes.length;++i) {
                    var node = nodes[i];
                    var hd = new HttpDownloader(node.uri, node.type);
                    d.addNode(hd);
                }
            } else {
                debug('noMoreNodes');
                d.noMoreNodes = true;
            }
        });

    });
    d.on('needsource', function () {

        if (!self.nodeSet.has(self.src)) {
            var hd = new HttpDownloader(self.src, 'server');
            d.addNode(hd);
            debug('dispatcher add source:'+self.src);
            self.nodeSet.add(self.src);
        }


    });

    d.on('needmoredatachannels', function () {
        debug('request more datachannels');
        if (self.websocket && self.websocket.readyState === WebSocket.OPEN) {

            var hash = md5(self.urlObj.host + self.urlObj.path);
            self.websocket.push(JSON.stringify({
                "action": "get",
                "peer_id": self.peerId,
                "host": self.urlObj.host,
                "uri": self.urlObj.path,
                "md5": hash
            }));
        }
    });
    d.once('done', function () {

        var traffics = [];
        var sourceObj = self._debugInfo.traffics;
        for (var mac in sourceObj) {
            traffics.push(sourceObj[mac]);
        }
        // console.warn('traffics:'+JSON.stringify(traffics));
        Reporter.finalyReportTraffic(self.peerId, self.fileLength, traffics);
        //移除interval
        clearInterval(self.reportTrafficId);
        clearInterval(self.reportAbilitiesId);
        self.reportTrafficId = null;

        self.emit('done');
    });
    d.on('downloaded', function (downloaded) {

        var progress = downloaded > 1.0 ? 1.0 : downloaded;
        self.emit('progress', progress);
    });
    d.on('meanspeed', function (meanSpeed) {


        self.emit('meanspeed', meanSpeed);
    });
    d.on('fograte', function (fogRate) {

        self.emit('fogratio', fogRate);
    });
    d.on('fogspeed', function (speed) {

        self.emit('fogspeed', speed);
    });
    d.on('cloudspeed', function (speed) {

        self.emit('cloudspeed', speed);
    });
    d.on('buffersources', function (bufferSources) {       //s: server   n: node  d: data channel  b: browser

        self.emit('buffersources', bufferSources);
    });
    d.on('sourcemap', function (sourceType, index) {       //s: server   n: node  d: data channel  b: browser

        self.emit('sourcemap', sourceType, index);
    });
    d.on('traffic', function (mac, size, type, meanSpeed) {

        //流量上报
        if (!self._debugInfo.traffics[mac]) {
            self._debugInfo.traffics[mac] = {};
            self._debugInfo.traffics[mac].mac = mac;
            self._debugInfo.traffics[mac].traffic = size;
        } else {
            self._debugInfo.traffics[mac].traffic += size;
        }

        //能力值上报
        if (meanSpeed) {
            self._debugInfo.abilities[mac] = meanSpeed;
        }

        self.emit('traffic', mac, size, type);
    });
    d.on('datachannelerror', function () {

        self._debugInfo.usefulDCs --;
    });
    d.on('fillwindow', function (windowOffset, windowLength) {

        self._debugInfo.windowOffset = windowOffset;
        self._debugInfo.windowLength = windowLength;
    });
    d.on('httperror', function () {
        self._debugInfo.usefulHTTPAndHTTPS --;
    })
};

Worker.prototype._initRangeLoader = function (nodes) {
    debug('_initRangeLoader');
    var initialDownloaders = [];
    for (var i=0;i<nodes.length;++i) {
        var node = nodes[i];
        var hd = new HttpDownloader(node.uri, node.type);
        hd.id = i;                                                 //test
        initialDownloaders.push(hd);
    }

    this.loader = new RangeLoader({initialDownloaders:initialDownloaders})

    this.emit('begin');
};

function getBrowserRTC () {
    if (typeof window === 'undefined') return null;
    var wrtc = {
        RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection,
    };
    if (!wrtc.RTCPeerConnection) return null;
    return wrtc
}

function makeCandidateArr(sdp) {
    var rawArr = sdp.split('\r\n');

    var ufrag_reg = /^(a=ice-ufrag)/;
    var ice_ufrag;
    for (var i=0; i<rawArr.length; ++i) {
        if (ufrag_reg.test(rawArr[i])) {
            ice_ufrag = rawArr[i].split(':')[1];
            break
        }
    }

    var reg = /^(a=candidate)/;
    var candidateArr = [];

    for (var i=0; i<rawArr.length; ++i) {
        if (reg.test(rawArr[i])) {
            rawArr[i] += ' generation 0 ufrag ' + ice_ufrag + ' network-cost 50';
            var candidates = {
                "sdpMid":"data",
                "sdpMLineIndex":0
            };
            candidates.candidate = rawArr[i].substring(2);
            candidateArr.push(candidates);
        }
    }

    // debug('candidateArr:'+JSON.stringify(candidateArr));

    return candidateArr;
}

