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


/* Queues */
var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');


/* Actions */
crawlersQueue.process(function(job, done){
    console.log("Got job");

    // Check if URL is already crawled
    var url = job.data.link;
    var prefix = job.data.prefix;

    console.log(url);
    wedis.exists(url, function(reply){
        console.log(reply);

        if(!reply) {

            wedis.ack(url, function(reply){

                console.log(reply);
                if(reply){

                    request({url: url, time: true}, function (error, response, html) {

                        if(!error){

                            var $ = cheerio.load(html);

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

                                            wedis.publish('manager', link);
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

                                            wedis.publish('manager', link);
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

//crawlersQueue.add({msg: 'test'});
