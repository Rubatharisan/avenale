/*
 Created by Rubatharisan Thirumathyam
 */


/* Required packages to run manager.js */
// Bull - our queue library
var Queue = require('bull');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

// Wedis - our custom library for utilities
var wutil = require('./lib/wutil');


/* Queues */
var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');


/* Action */
wedis.subscribe('manager', function(url){
    console.log(url)
    wedis.exists(url, function(reply){
        if(!reply){
            wedis.inqueue(url, function(reply){
                if(reply){
                    console.log("URL already in queue");
                } else {
                    wedis.enqueue(url, function(reply){
                        if(reply){
                            crawlersQueue.add({link: url});
                        } else {
                            console.log("Failed to enqueue link " + url);
                        }
                    });
                }
            })
        }
    })
})