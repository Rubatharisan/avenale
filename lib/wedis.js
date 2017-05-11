var redis = require("redis"),
    client = redis.createClient();

var sub = redis.createClient();
var pub = redis.createClient();

var wedis = {
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
        console.log(url);
        client.hget(url + ":data", 'html', callback);
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
        client.flushdb();
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


    }
};

module.exports = wedis;