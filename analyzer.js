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


// Logger instances - logging what needed
var debug = require('debug');

var log = {
        log: debug('analyzer:log'),
        status: debug('analyzer:status'),
        error: debug('analyzer:error'),
        link: debug('analyzer:link')
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
        log.log("[WORKER.ID#" + worker.id + "] ready")
    });

    cluster.on('exit', function(worker, code, signal) {
        log.error("[WORKER.PID#" + worker.process.pid + ", .# " + worker.id + "] died");
    });

} else {

    log.status("Inside worker");

    analyzersQueue.process(function (job, done) {

        job.data.emotion = 'good';

        wedis.getHttpStatus(job.data.link, function (reply) {
            if (reply !== "200") {
                job.data.emotion = 'bad';
                messageQueue.add(job.data)
                log.link("Bad link: ", job.data.link, 'http code: ' + reply);
            }

            log.link("Good link: ", job.data.link);

            done();
        })

    });

}

