// Bull - our queue library
var Queue = require('bull');
var config = require('../config.json');

var redis_config = {
    "host": config.redis_host,
    "port": config.redis_port
}

var redis = require("redis"),
    client = redis.createClient(redis_config);


var wedis = {
    addToCrawlersQueue: function(sessionData, callback){
        var crawlersQueue = Queue('crawlers', redis_config.port, redis_config.host);
        crawlersQueue.add(sessionData);
        crawlersQueue.close();
        callback();
    },

    exists : function(url, callback){
        client.get(url, function (err, reply) {
            if(reply === null){
                callback(false);
            } else {
                callback(true);
            }
        });
    },

    ack : function(url, callback) {
        wedis.exists(url, function (reply) {
            if (!reply) {
                client.set(url, true, function (err, reply) {
                    if (!err) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                })
            } else {
                callback(false);
            }
        })
    },

    getset : function(url, value, callback){
      client.getset(url, value, function(err, reply){
          callback(err, reply);
      });
    },

    setInternalLink : function(url, link, callback){
        client.sadd(url + ":internal_links", link, callback);
    },

    setImageLink : function(url, imagelink, callback){
        client.sadd(url + ":internal_image_links", imagelink, callback);
    },

    appearsOn : function(target, source){
        client.sadd(target + ":appears_on", source);
    },

    imageAppearsOn : function(target, source){
        client.sadd(target + ":appears_on", source);
    },

    setHttpStatus : function(url, status, callback){
        client.hset(url + ":data", 'httpCode', status, callback);
    },

    getHttpStatus : function(url, callback){
        client.hget(url + ":data", 'httpCode', function(err, reply){
            callback(reply);
        });
    },

    setMeta : function(data, callback){

        for(var propertyName in data) {

            if(data[propertyName] != undefined) {
                client.hset(data.page_link + ":meta", propertyName, data[propertyName], function (err, reply) {
                    if(err){
                        throw err;
                    }
                });
            }
        }

        callback();


    },

    setHeaders : function(url, data, callback){
        for(var propertyName in data) {

            if(data[propertyName] != undefined){
                client.hset(url + ":headers", propertyName, data[propertyName].toString(), function(err){
                    if(err){
                        throw err;
                    }
                });
            }

        }

        callback();
    },

    setHtml : function(url, data, callback){
        client.hset(url + ":data", 'html', data, callback);
    },

    getHtml : function(url, callback){
        client.hget(url + ":data", 'html', function(err, reply){
            callback(reply, err);
        });
    },

    getRequiredTests : function(sessionId, callback){
        client.hget(sessionId, 'tests', function(err, reply){
            if(reply.indexOf(',') >= 0){
                callback(reply.split(','), err);
            } else {
                callback([reply], err);
            }
        })
    },

    enqueue : function(url, callback){
        wedis.getset(url + ":inqueue", 'true', function(err, reply){
            callback(reply, err);
        });
    },

    setSession : function(data, callback){

        for(var propertyName in data) {
            client.hset(data.sessionId, propertyName, data[propertyName], function(err, reply){
                if(err){
                    throw err;
                }
            });
        }

        callback();

    },

    getHeaders : function(url, callback){
        client.hgetall(url + ":headers", function(err, headers) {
            callback(headers);
        });

    },

    flushdb : function(callback){
        client.flushdb(function(err, reply){
            //console.log(err, reply);
            callback();
        });
    },

    getMeta : function(link, callback){
        var link = {
            linkId: link
        }

        /* wedis.getHttpStatus(link.linkId, function(reply){
            link.httpStatus = reply;
            callback.send(link);
        }) */

        client.hgetall(link.linkId + ":meta", function(err, reply){
            var metaData = reply;
            client.smembers(link.linkId + ":appears_on", function(err, reply){
                var appearsOn = reply;

                client.smembers(link.linkId + ":internal_links", function(err, reply){
                    var linksTo = reply;

                    var response = {
                        meta: metaData,
                        appears_on: appearsOn,
                        links_to: linksTo
                    }

                    callback.send(response);
                });

            });
        });


    },

    getMetaData : function(link, callback){
        var link = {
            linkId: link
        }

        /* wedis.getHttpStatus(link.linkId, function(reply){
         link.httpStatus = reply;
         callback.send(link);
         }) */

        client.hgetall(link.linkId + ":meta", function(err, reply){
            var metaData = reply;
            callback(metaData);
        });
    },

    getHost : function(){
        return config.redis_host;
    },

    getPort : function(){
        return config.redis_port;
    }
};

module.exports = wedis;