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
var jobsQueue = Queue('jobs', 6379, '127.0.0.1');


/* Action */
wedis.subscribe('manager', function(page){

    page = JSON.parse(page);
    var url = page.url;

    wedis.exists(url, function(reply){
        if(!reply){
            wedis.inqueue(url, function(reply){
                if(reply){
                    console.log("URL already in queue");
                } else {
                    wedis.enqueue(url, function(reply){
                        if(reply){
                            jobsQueue.add({queue: page.queue, link: url});
                        } else {
                            console.log("Failed to enqueue link " + url);
                        }
                    });
                }
            })
        }
    })

})


jobsQueue.process(function(job, done) {
    console.log("Adding " + job.data.link + " to queue: " + job.data.queue);

    var crawlingQueue = Queue(job.data.queue);
    crawlingQueue.add({link: job.data.link});
    crawlingQueue.close().then(function () {
        done();
    })

});