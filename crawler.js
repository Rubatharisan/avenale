/*
 Created by Rubatharisan Thirumathyam
 */


/* Required packages to run crawler.js */
// Bull - our queue library
var Queue = require('bull');

// Request - our library for sending out requests
var request = require('request');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

// Wedis - our custom library for utilities
var wutil = require('./lib/wutil');

// Cheerio - our HTML to jQuery DOM library
var cheerio = require('cheerio');

const cluster = require('cluster');

/* Queues */
var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');

var numWorkers = 10;

if(cluster.isMaster){

    crawlersQueue.process(function(job, done){
        console.log("** New site crawling request **");
        var workers = [];

        var workQueue = Queue("crawlers:" + job.data.prefix);

        workQueue.add({link: job.data.link});

        job.data.queue = "crawlers:" + job.data.prefix;

        workQueue.on('ready', function() {
            // Queue ready for job
            // All Redis connections are done
            console.log("HI!");
        });

        workQueue.on('global:completed', function(completedJob, result){
            // Job completed with output result!
            workQueue.getJobCounts().then(function(e){
                console.log(e);
                if(e.wait == 0 && e.active == 0 && e.delayed == 0){
                    console.log(job.data.queue + " is done now");

                    workers.forEach(function(worker){
                        worker.kill();
                    });

                    done();
                }
            });
        })

        for (var i = 0; i < numWorkers; i++) {
            var worker = cluster.fork();
            workers.push(worker);
            worker.send( job.data );
        }

        cluster.on('online', function(worker) {
            // Lets create a few jobs for the queue workers
            console.log("Online");
        });

        cluster.on('exit', function(worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
        });




    });

} else {


    /* workQueue.process(function(job, jobDone){
        console.log("Job done by worker", cluster.worker.id, job.jobId);
        jobDone();
    }); */

    process.on('message', function(data) {
        // we only want to intercept messages that have a chat property
        if (data) {

            var workQueue = Queue(data.queue);

            workQueue.process(function(job, done){
                var url = job.data.link;

                wedis.exists(url, function(reply){
                    console.log(reply);

                    if(!reply) {

                        wedis.ack(url, function(reply){

                            console.log(reply);
                            if(reply){

                                request({url: url, time: true}, function (error, response, html) {

                                    if(!error){

                                        var $ = cheerio.load(html);

                                        console.log('[WORKER.#' + cluster.worker.id + "]");
                                        console.log("HTTP status: " + response.statusCode);
                                        console.log("Page titel: " + $('title').text());
                                        console.log("Meta description: " + $('meta[name="description"]').attr('content'));
                                        console.log("URL: " + url);
                                        console.log("Links: " + $('a').length);
                                        console.log("Images: " + $('img').length);
                                        console.log("Time taken: " + response.elapsedTime + "ms");
                                        console.log();



                                        if(("a").length > 0) {
                                            var internalLinks = new Set();

                                            $("a").each(function (i) {
                                                if (typeof(this.attribs.href) !== "undefined") {


                                                    if (this.attribs.href.charAt(0) == '/') {
                                                        this.attribs.href = wutil.appendRelativePath(url, this.attribs.href);
                                                    }


                                                    if (this.attribs.href.indexOf(wutil.getHostnameByUrl(url)) !== -1) {
                                                        var cleanLink = wutil.cleanUrl(this.attribs.href);
                                                        internalLinks.add(cleanLink);

                                                    } else {
                                                        //wedis.setExternalLink(cUrl, wutil.cleanUrl(this.attribs.href));
                                                    }
                                                }

                                                if (i === $('a').length - 1) {
                                                    internalLinks.forEach(function (link) {
                                                        wedis.setInternalLink(url, link);

                                                        wedis.appearsOn(link, url); // Double check this

                                                        var crawlThis = {
                                                            url: link,
                                                            queue: data.queue
                                                        }



                                                        //console.log(JSON.stringify(crawlThis));
                                                        wedis.publish('manager', JSON.stringify(crawlThis));
                                                    });
                                                }
                                            });
                                        }

                                        if($("img").length > 0){
                                            var internalImageLinks = new Set();

                                            $("img").each(function(i){
                                                if (typeof(this.attribs.src) !== "undefined") {
                                                    if (this.attribs.src.charAt(0) == '/') {
                                                        this.attribs.src = wutil.appendRelativePath(url, this.attribs.src);
                                                    }

                                                    if (this.attribs.src.indexOf(wutil.getHostnameByUrl(url)) !== -1) {
                                                        var cleanLink = wutil.cleanUrl(this.attribs.src);
                                                        internalImageLinks.add(cleanLink);

                                                    } else {
                                                        //wedis.setExternalLink(cUrl, wutil.cleanUrl(this.attribs.href));
                                                    }
                                                }


                                                if (i === $('img').length - 1) {
                                                    internalImageLinks.forEach(function (link) {
                                                        wedis.setImageLink(url, link);

                                                        wedis.imageAppearsOn(link, url); // Double check this

                                                        // wedis.publish('manager', link);
                                                    });
                                                }
                                            });
                                        }


                                        wedis.setData(url, html, function(){
                                            wedis.setHttpStatus(url, response.statusCode, function(){
                                                done();
                                            });
                                        });



                                    }

                                });
                            } else {
                                done(Error('error ack url: ' + url));
                            }

                        })

                    } else {
                        done();
                    }

                });
            });

        }




    });


}


/* Actions */

//crawlersQueue.add({msg: 'test'});
