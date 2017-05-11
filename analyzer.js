/* Required packages to run crawler.js */
// Bull - our queue library
var Queue = require('bull');

// Request - our library for sending out requests
var request = require('request');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

// Wedis - our custom library for utilities
var wutil = require('./lib/wutil');

var analyzersQueue = Queue('analyzers');
var messageQueue = Queue('messages');
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

var os = require('os'),
    cpuCount = os.cpus().length;


const cluster = require('cluster');

var numWorkers = cpuCount * 2;
var analyzersQueue = Queue('analyzers');



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

        var notified = false;

        log.status(job.data);

        wedis.getHtml(url, function(htmlContent){
            var $ = cheerio.load(htmlContent);
            log.status($('a').length);

            wedis.getHttpStatus(job.data.link, function (reply) {
                if (reply !== "200") {
                    log.bad_link("Bad link: ", job.data.link, 'http code: ' + reply);
                    doNotify();
                } else {
                    log.link("Good link: ", job.data.link);
                }

            });

            console.log(htmlContent);
        });


        var doNotify = function(){
            if(notified === false) {

                job.data.emotion = 'bad';
                notified = true;
                messageQueue.add(job.data);

            }
        }


    });

}

