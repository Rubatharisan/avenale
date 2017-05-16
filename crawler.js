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
var redis_host = wedis.getHost();
var redis_port = wedis.getPort();


// Wedis - our custom library for utilities
var wutil = require('./lib/wutil');

// Cheerio - our HTML to jQuery DOM library
var cheerio = require('cheerio');

// Debugger - our debugging tool
var debug = require('debug');

// Logger - logging what needed
var log = {
    log: debug('crawler:log'),
    status: debug('crawler:status'),
    error: debug('crawler:error')
}



const cluster = require('cluster');

// Get OS amount of cores
var os = require('os'),
    cpuCount = os.cpus().length * 2;


/* Queues */
var crawlersQueue = Queue('crawlers', redis_port, redis_host);


if(cluster.isMaster){

    log.log("Master loaded");



    crawlersQueue.process(function(job, done){
        var isCompleted = false;

        log.log("New crawling request", job.data);

        var workQueue = Queue("crawlers:" + job.data.queueId, redis_port, redis_host);
        job.data.queue = "crawlers:" + job.data.queueId;

        var analyzeQueue = Queue('analyzers', redis_port, redis_host);

        workQueue.add(
            {
                link: job.data.domain
            }
        );

        workQueue.on('ready', function() {

        });

        workQueue.on('global:completed', function(completedJob, result){
            // Job completed with output result!
            log.status("Crawling completed:", completedJob.data, job.data.sessionId);

            var object = {
                link: completedJob.data.link,
                sessionId: job.data.sessionId,
            }

            analyzeQueue.add(object);

            workQueue.getJobCounts().then(function(e){
                log.status('Crawling in queue: ', e);

                if(e.wait == 0 && e.active == 0 && e.delayed == 0 && isCompleted == false){
                    isCompleted = true;

                    done(
                        log.log("I am done now with " + job.data.domain)
                    );
                }
            });
        });

        for (var i = 0; i < job.data.workers; i++) {
            var worker = cluster.fork();
            worker.send( job.data );
        }

        cluster.on('online', function(worker) {
            log.log("[CRAWLER.ID#" + worker.id + "] ready")
        });

        cluster.on('exit', function(worker, code, signal) {
            log.error("[CRAWLER.PID#" + worker.process.pid + ", .# " + worker.id + "] died");
        });

    });

} else {


    process.on('message', function(data) {
        // we only want to intercept messages that have a chat property
        if (data) {

            var workQueue = Queue(data.queue, redis_port, redis_host);

            workQueue.process(function(job, done){
                var url = job.data.link;

                wedis.getset(url, 'true', function(err, reply){

                    if(!reply && !err) {

                        request({url: url, time: true}, function (error, response, html) {

                            if(!error){

                                var $ = cheerio.load(html);

                                log.log("----------------------------------------");
                                log.log('[WORKER.ID#' + cluster.worker.id + "]");
                                log.log("HTTP status: " + response.statusCode);
                                log.log("Page titel: " + $('title').text());
                                log.log("Meta description: " + $('meta[name="description"]').attr('content'));
                                log.log("URL: " + url);
                                log.log("Links: " + $('a').length);
                                log.log("Images: " + $('img').length);
                                log.log("Time taken: " + response.elapsedTime + "ms");
                                log.log("----------------------------------------");

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
                        done(log.error('error ack url: ' + url));
                    }

                });
            });


            var enqueue = function(url, workQueue){
                wedis.exists(url, function(reply){
                    if(!reply){
                        wedis.enqueue(url, function(reply){
                            if(!reply){
                                workQueue.add({link: url});
                            } else {
                                log.error("Already in queue", url);
                            }
                        });
                    }

                });
            }

        }




    });


}