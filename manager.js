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
//var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');
var dict = {};

/* Action */
wedis.subscribe('manager', function(page){
    page = JSON.parse(page);

    var workQueue;

    if(dict[page.queue]){
        workQueue = dict[page.queue];
        console.log("Exists!!");
    } else {
        workQueue = Queue(page.queue);
        dict[page.queue] = workQueue;
        console.log("Adding new!")
    }


    var workQueue = Queue(page.queue);

    var url = page.url;

    console.log(page);

    wedis.exists(url, function(reply){
        if(!reply){
            wedis.inqueue(url, function(reply){
                if(reply){
                    console.log("URL already in queue");
                } else {
                    wedis.enqueue(url, function(reply){
                        if(reply){
                            //workQueue.add({link: url});
                        } else {
                            console.log("Failed to enqueue link " + url);
                        }
                    });
                }
            })
        }
    })

    workQueue.close();
})