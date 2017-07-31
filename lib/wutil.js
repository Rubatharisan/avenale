var normalizeUrl = require('normalize-url');
var liburl = require('url');
var crypto = require('crypto');
var base64url = require('base64url');
var URI = require('urijs');

var wutil = {
    cleanUrl : function(url){
        return normalizeUrl(url)
    },

    appendRelativePath : function(url, relativePath){
        if(relativePath.charAt(0) == "/"){
            return liburl.parse(url).hostname + relativePath;
        }
        else if(relativePath.charAt(0) == "?"){
            var link = URI(url);
            link.search(relativePath);
            return link.toString();
        }
        else {
            var link = URI(url);
            link.search("");
            return link.toString() + "/" + relativePath;
        }
    },

    getHostnameByUrl : function(url){
        if(url == false){
            return false;
        }

        return liburl.parse(url).hostname;
    },

    randomStringAsBase64 : function(size) {
        return base64url(crypto.randomBytes(size));
    }
}

Object.freeze(wutil);

module.exports = wutil;
