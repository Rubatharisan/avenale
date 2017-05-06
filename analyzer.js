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


analyzersQueue.process(function(job, done){

    job.data.emotion = 'good';

    wedis.getHttpStatus(job.data.link, function(reply){
        if(reply !== "200"){
            job.data.emotion = 'bad';
        }

        messageQueue.add(job.data);
        done();
    })

    



})
