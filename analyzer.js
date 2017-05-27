/* Required packages to run crawler.js */
// Bull - our queue library
var Queue = require('bull');

// Request - our library for sending out requests
var request = require('request');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

// Wedis - our custom library for utilities
var wutil = require('./lib/wutil');

// Tests
var caseController = require('./tests/index.js');

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
var analyzersQueue = Queue('analyzers');
var messageQueue = Queue('messages');

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

        wedis.getHtml(url, function (htmlContent) {
            var $ = undefined;

            if (htmlContent != undefined) {
                $ = cheerio.load(htmlContent);
            }

            wedis.getMetaData(url, function (meta) {

                wedis.getHeaders(url, function (headers) {

                    wedis.getHttpStatus(url, function(httpCode){

                        wedis.getRequiredTests(job.data.sessionId, function (requiredTests) {

                            var urlData = {
                                url: url,
                                meta: meta,
                                headers: headers,
                                httpCode: httpCode,
                                requiredTests: requiredTests
                            }

                            var issues = caseController.do(urlData, $, wedis);

                            if (Object.keys(issues).length !== 0) {
                                issues.sessionId = job.data.sessionId;
                                issues.link = url;
                                issues.emotion = 'bad';
                                messageQueue.add(issues);
                                console.log(issues);
                            }


                            done();

                        });
                    });

                });

            });


        });

    });

}