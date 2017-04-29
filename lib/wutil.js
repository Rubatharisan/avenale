var normalizeUrl = require('normalize-url');
var liburl = require('url');

var wutil = {
    cleanUrl : function(url){
        return normalizeUrl(url);
    },

    appendRelativePath : function(url, relativePath){
        return liburl.parse(url).hostname + relativePath;
    },

    getHostnameByUrl : function(url){
        return liburl.parse(url).hostname;
    }
}

Object.freeze(wutil);

module.exports = wutil;
