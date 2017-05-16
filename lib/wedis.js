// Bull - our queue library
var Queue = require('bull');

var config = require('../config.json');

var redis_config = {
    "host": config.redis_host,
    "port": config.redis_port
}

var redis = require("redis"),
    client = redis.createClient(redis_config);

var sub = redis.createClient(redis_config);
var pub = redis.createClient(redis_config);
var crawlersQueue = Queue('crawlers', redis_config.port, redis_config.host);


var wedis = {
    addToCrawlersQueue: function(sessionData, callback){
        crawlersQueue.add(sessionData);
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
            client.hset(data.page_link + ":meta", propertyName, data[propertyName], function(){

            });
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

    getTests : function(sessionId, callback){
        client.hget(sessionId, 'tests', function(err, reply){
            callback(reply.split(','), err);
        })
    },

    inqueue : function(url, callback) {
        client.hexists(url + ':data', 'inqueue', function(err, reply){
           callback(reply);
        });
    },

    enqueue : function(url, callback){
        wedis.getset(url + ":inqueue", 'true', function(err, reply){
            callback(reply, err);
        });
    },


    setSession : function(data, callback){

        for(var propertyName in data) {
            client.hset(data.sessionId, propertyName, data[propertyName], function(){

            });
        }

        callback();


    },


    flushdb : function(callback){
        client.flushdb(function(err, reply){
            //console.log(err, reply);
            callback();
        });
    },

    subscribe : function(channel, callback){

        sub.on("message", function (iChannel, message) {
            if(iChannel === channel){
                callback(message);
            }
        });

        sub.subscribe(channel);

    },

    publish : function(channel, message){
        pub.publish(channel, message);
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

    getHost : function(){
        return config.redis_host;
    },

    getPort : function(){
        return config.redis_port;
    }
};

module.exports = wedis;