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

// Cheerio - our HTML to jQuery DOM manipulator library
var cheerio = require('cheerio');

// Debugger - our debugging tool
var debug = require('debug');

// Logger - logging what is needed
var log = {
    log: debug('crawler:log'),
    status: debug('crawler:status'),
    error: debug('crawler:error'),
    currentjob: debug('crawler:job:id')
}

// Node.js cluster functionality
const cluster = require('cluster');

// Get OS amount of cores
var os = require('os'),
    cpuCount = os.cpus().length * 2;


/* Queues */


if(cluster.isMaster){

    log.log("Master loaded");

    var crawlersQueue = Queue('crawlers', redis_port, redis_host, wedis.opts());

    crawlersQueue.process(function(job, done){
        var workers = [];
        var isCompleted = false;

        log.log("New crawling request", job.data);

        var workQueue = Queue("crawlers:" + job.data.queueId, redis_port, redis_host, wedis.opts());
        job.data.queue = "crawlers:" + job.data.queueId;

        var analyzeQueue = Queue('analyzers', redis_port, redis_host, wedis.opts());

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

                    // @TODO: Close only if it is closed
                    workQueue.close();

                    workers.forEach(function(worker){
                        worker.send("kill");
                    });

                    done(
                        log.log("I am done now with " + job.data.domain)
                    );


                }
            });
        });

        for (var i = 0; i < job.data.workers; i++) {
            var worker = cluster.fork();
            workers[i] = worker;
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
        if(data == "kill"){
            process.exit();
        }


        if (data.queue) {
            var coreDomain = wutil.getHostnameByUrl(data.domain);

            var workQueue = Queue(data.queue, redis_port, redis_host, wedis.opts());

            workQueue.process(function(job, done){
                log.currentjob('Doing: ', job.data);
                console.log('Doing: ', job.data);
                var url = job.data.link;

                wedis.getset(url, 'true', function(err, reply){

                    if(!reply && !err) {
                        request({url: url, time: true}, function (error, response, html) {

                            if(!error){
                                var contentType = response.headers['content-type'];

                                if(contentType.indexOf("text/html") >= 0) {
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


                                    if (("a").length > 0) {
                                        var internalLinks = new Set();

                                        $("a").each(function (i) {
                                            if (typeof(this.attribs.href) !== "undefined") {

                                                // /example --> *.domain.tld/example ... //example.com --> http://example.com
                                                if (this.attribs.href.charAt(0) == '/' && this.attribs.href.charAt(1) != '/') {
                                                    this.attribs.href = wutil.appendRelativePath(url, this.attribs.href);
                                                }

                                                // @TODO: Bug, if example.com/?target.dk/, then all example.com/* is going to be crawled.
                                                if (this.attribs.href.indexOf(coreDomain + '/') !== -1) {
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

                                    if ($("img").length > 0) {
                                        var internalImageLinks = new Set();

                                        $("img").each(function (i) {
                                            if (typeof(this.attribs.src) !== "undefined") {

                                                // /example --> *.domain.tld/example
                                                if (this.attribs.src.charAt(0) == '/') {
                                                    this.attribs.src = wutil.appendRelativePath(url, this.attribs.src);
                                                }

                                                // Does link contain
                                                if (this.attribs.src.indexOf(coreDomain !== -1)) {
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

                                                    enqueue(link, workQueue);
                                                });
                                            }
                                        });
                                    }


                                    wedis.setHtml(url, html, function () {
                                        wedis.setMeta(meta, function () {
                                            wedis.setHeaders(url, response.headers, function(){
                                                wedis.setHttpStatus(url, response.statusCode, function () {
                                                    done();
                                                });
                                            });
                                        });
                                    });

                                } else if(contentType.indexOf('image/') >= 0){
                                    console.log("This is a image");
                                    console.log(response.headers);
                                    console.log(contentType);

                                    wedis.setHttpStatus(url, response.statusCode, function () {
                                        wedis.setHeaders(url, response.headers, function(){
                                            done();
                                        })
                                    });


                                } else {
                                    console.log("Not HTML");
                                    console.log(contentType);
                                    wedis.setHttpStatus(url, response.statusCode, function () {
                                        wedis.setHeaders(url, response.headers, function(){
                                            done();
                                        })
                                    });

                                }

                            } else {
                                console.log("Sorry,", error, url);
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