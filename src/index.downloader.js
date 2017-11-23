/**
 * Created by XieTing on 17-6-6.
 */

module.exports = PearDownloader;

var debug = require('debug');
var inherits = require('inherits');
var Worker = require('./worker');
var version = '1.1.4';

inherits(PearDownloader, Worker);

function PearDownloader(urlStr, token, opts) {
    var self = this;
    if (!(self instanceof PearDownloader)) return new PearDownloader(urlStr, token, opts);
    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return PearDownloader(urlStr, '', token);

    if (opts.debug) {
        debug.enable('pear:*');
    } else {
        debug.disable();
    }
    self.version = version;
    console.info('downloader version:'+version);

    Worker.call(self, urlStr, token, opts);
}

class  PearDownloaderTag extends HTMLElement {
    constructor() {
        super();
        this.progress = 0;
        this.status = 'ready';
        this.speed = 0;
        this.fileName = 'unknown';
        this.p2pRatio = 0;

        this.addEventListener('click', e => {
            if (this.disabled) {
            return;
        }
        this.downloader = this.createDownloader();
        this.downloaderLifeCycle();
    });
    }

    connectedCallback() {
        // this.textContent = "卧槽！！！ - ";
    }

    createDownloader() {
        if (!this.hasAttributes('data-src')) {
            console.error('Must set data-src attribuite!');
            return false;
        }
        let token = '';
        if (this.hasAttributes('data-token')) {
            token = this.dataset.token;
        }

        let downloader = new PearDownloader(this.dataset.src, token, {
            useMonitor: true,             //是否开启monitor,会稍微影响性能,默认false
        });
        return downloader;
    }

    downloaderLifeCycle() {
        this.downloader.on('begin', () => {
            this.status = 'ready';
            this.fileName = this.downloader.fileName;

            let ev = new CustomEvent("progress");
            this.dispatchEvent(ev);
        });

        this.downloader.on("progress", (prog) => {
            // let percent = (prog * 100).toFixed(1) + '%';
            this.progress = prog;
            this.status = prog < 1.0 ? 'downloading' : 'done';

            let ev = new CustomEvent("progress");
            this.dispatchEvent(ev);
        });

        this.downloader.on('meanspeed', (speed) => {
            this.speed = speed;
        });

        this.downloader.on('done', () => {
            let aTag = document.createElement('a');
            aTag.download = this.fileName;
            this.downloader.file.getBlobURL(function (error, url) {
                aTag.href = url;
                aTag.click();
            })

        });
        this.downloader.on('fograte', (p2pRatio) => {

            this.p2pRatio = p2pRatio;
        });

    }
}

if (!window.customElements.get('pear-downloader')) {
    window.customElements.define('pear-downloader', PearDownloaderTag);
}

