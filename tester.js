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

var crypto = require('crypto');
var base64url = require('base64url');
var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');


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


var sessionId = randomStringAsBase64Url(24);
var queueId = randomStringAsBase64Url(12);

var sessionData = {
    'sessionId' : sessionId,
    'email': 'rt@morningtrain.dk',
    'domain': 'http://bloomit.dk.bluebird.pw',
    'queueId': queueId
};
wedis.flushdb(function(){
    wedis.setSession(sessionData, function(){
        crawlersQueue.add(sessionData);
    });
});




//analyzersQueue.add({link: 'http://bloomit.dk.bluebird.pw', sessionId: 'test'});

function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}