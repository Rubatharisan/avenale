var normalizeUrl = require('normalize-url');
var liburl = require('url');
var crypto = require('crypto');
var base64url = require('base64url');

var wutil = {
    cleanUrl : function(url){
        return normalizeUrl(url);
    },

    appendRelativePath : function(url, relativePath){
        return liburl.parse(url).hostname + relativePath;
    },

    getHostnameByUrl : function(url){
        return liburl.parse(url).hostname;
    },

    randomStringAsBase64Url : function(size) {
        return base64url(crypto.randomBytes(size));
    }
}

Object.freeze(wutil);

module.exports = wutil;
