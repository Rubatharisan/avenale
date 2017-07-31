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

// Tests
var caseController = require('./tests/caseController.js');

var cheerio = require('cheerio');


// Logger instances - logging what needed
var debug = require('debug');

var log = {
        log: debug('analyzer:log'),
        status: debug('analyzer:status'),
        error: debug('analyzer:error'),
        link: debug('analyzer:link'),
        bad_link: debug('analyzer:bad_link')
}

var os = require('os');

const cluster = require('cluster');

var numWorkers = 1;
var analyzersQueue = Queue('analyzers', redis_port, redis_host);
var messageQueue = Queue('messages', redis_port, redis_host);

if(cluster.isMaster){
    log.log("Master loaded");

    for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }


    cluster.on('online', function(worker) {
        log.log("[ANALYZER.ID#" + worker.id + "] ready")
    });

    cluster.on('exit', function(worker, code, signal) {
        log.error("[ANALYZER.PID#" + worker.process.pid + ", .# " + worker.id + "] died");
    });

} else {


    analyzersQueue.process(function (job, done) {

        var url = job.data.link;
        console.log(url);
        wedis.getHtml(url, function (htmlContent) {
            var $ = undefined;

            if (htmlContent != undefined) {
                $ = cheerio.load(htmlContent);
            }

            wedis.getMetaData(url, function (meta) {

                wedis.getHeaders(url, function (headers) {

                    wedis.getHttpStatus(url, function(httpCode){

                        wedis.getRequiredTests(job.data.sessionId, function (requiredTests) {

                            if(headers['content-type']){
                                var urlData = {
                                    url: url,
                                    meta: meta,
                                    headers: headers,
                                    httpCode: httpCode,
                                    requiredTests: requiredTests
                                };

                                var issues = caseController.do(urlData, $, wedis);

                                if (Object.keys(issues).length !== 0) {
                                    var message = {
                                        link: url,
                                        emotion: 'bad',
                                        sessionId: job.data.sessionId,
                                        issues: issues
                                    };
                                    messageQueue.add(message);

                                    issues.link = url;
                                    wedis.addIssues(job.data.sessionId, JSON.stringify(issues));
                                }

                            } else {
                                console.log("Sorry, no Content-Type", url);
                            }

                            done();

                        });
                    });

                });

            });


        });

    });

}

