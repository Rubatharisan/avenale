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

        var workQueue = Queue("crawlers:" + job.data.queueId);
        job.data.queue = "crawlers:" + job.data.queueId;

        var analyzeQueue = Queue('analyzers');

        workQueue.add(
            {
                link: job.data.domain
            }
        );

        workQueue.on('ready', function() {

        });

        workQueue.on('global:completed', function(completedJob, result){
            // Job completed with output result!
            console.log(completedJob.data, job.data.sessionId);

            var object = {
                link: completedJob.data.link,
                sessionId: job.data.sessionId
            }

            analyzeQueue.add(object);

            workQueue.getJobCounts().then(function(e){
                console.log('Crawling in queue: ', e);
                if(e.wait == 0 && e.active == 0 && e.delayed == 0){

                    /* workers.forEach(function(worker){
                        worker.kill();
                    }); */

                    //                    done();
                }
            });
        });

        for (var i = 0; i < numWorkers; i++) {
            var worker = cluster.fork();
            workers.push(worker);
            worker.send( job.data );
        }

        cluster.on('online', function(worker) {
            console.log("[WORKER.ID#" + worker.id + "] ready")
        });

        cluster.on('exit', function(worker, code, signal) {
            console.log("[WORKER.PID#" + worker.process.pid + ", .# " + worker.id + "] died");
        });




    });

} else {


    process.on('message', function(data) {
        // we only want to intercept messages that have a chat property
        if (data) {

            var workQueue = Queue(data.queue);

            workQueue.process(function(job, done){
                var url = job.data.link;

                wedis.exists(url, function(reply){

                    if(!reply) {

                        wedis.ack(url, function(reply){

                            if(reply){

                                request({url: url, time: true}, function (error, response, html) {

                                    if(!error){

                                        var $ = cheerio.load(html);

                                        console.log('[WORKER.ID#' + cluster.worker.id + "]");
                                        console.log("HTTP status: " + response.statusCode);
                                        console.log("Page titel: " + $('title').text());
                                        console.log("Meta description: " + $('meta[name="description"]').attr('content'));
                                        console.log("URL: " + url);
                                        console.log("Links: " + $('a').length);
                                        console.log("Images: " + $('img').length);
                                        console.log("Time taken: " + response.elapsedTime + "ms");
                                        console.log();

                                        var meta = {
                                            page_titel: $('title').text(),
                                            page_link: url,
                                            page_meta_description: $('meta[name="description"]').attr('content'),
                                            page_amount_links: $('a').length,
                                            page_amount_images: $('img').length,
                                            time_taken: response.elapsedTime
                                        }



                                        if(("a").length > 0) {
                                            var internalLinks = new Set();

                                            $("a").each(function (i) {
                                                if (typeof(this.attribs.href) !== "undefined") {


                                                    if (this.attribs.href.charAt(0) == '/') {
                                                        this.attribs.href = wutil.appendRelativePath(url, this.attribs.href);
                                                    }


                                                    if (this.attribs.href.indexOf(wutil.getHostnameByUrl(url) + '/') !== -1) {
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

                                                        //linksQueue.add({url: link});
                                                        enqueue(link, workQueue);

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


                                        wedis.setHtml(url, html, function(){
                                            wedis.setMeta(meta, function(){
                                                wedis.setHttpStatus(url, response.statusCode, function(){
                                                    done();
                                                });
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


            var enqueue = function(url, workQueue){
                wedis.exists(url, function(reply){
                    if(!reply){
                        wedis.inqueue(url, function(reply){
                            if(reply){
                                //console.log("URL already in queue");
                            } else {
                                wedis.enqueue(url, function(reply){
                                    if(reply){
                                        workQueue.add({link: url});
                                    } else {
                                        //console.log("Failed to enqueue link " + url);
                                    }
                                });
                            }
                        })
                    }
                });
            }

        }




    });


}