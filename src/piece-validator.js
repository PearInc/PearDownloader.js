module.exports = Validator;

var debug = require('debug')('pear:dispatcher');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var parseTorrentFile = require('parse-torrent-file');
var Rusha = require('rusha');

var Buffer = require('buffer/').Buffer;

inherits(Validator, EventEmitter);

function Validator(torrent) {
    EventEmitter.call(this);

    // var parsed
    // try {
    //     parsed = parseTorrentFile(torrent)
    // } catch (e) {
    //     // the torrent file was corrupt
    //     console.error(e)
    // }
    var parsed =  parseTorrentFile(Buffer.from(torrent));
    this.piecesHash = parsed.pieces;
}

Validator.prototype.validate = function (data, index) {

    var hash = Rusha.createHash().update(data).digest('hex');
    var equal = hash === this.piecesHash[index];
    if (!equal) {
        console.warn(`[HashValidateError] buffer validate fail ${index} hash ${hash} ref ${this.piecesHash[index]}`);
    }

    return equal;
}