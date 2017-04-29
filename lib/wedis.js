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
        client.hset(url + ":http", 'code', status, callback);
    },

    setData : function(url, data, callback){
        client.hset(url + ":data", 'html', data, callback);
    },

    inqueue : function(url, callback) {
        wedis.exists(url + ':inqueue', function(reply){
           callback(reply);
        });
    },

    enqueue : function(url, callback){
        wedis.ack(url + ":inqueue", function(reply){
            callback(reply);
        });
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
    }
};

module.exports = wedis;