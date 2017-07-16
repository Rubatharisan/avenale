/*
 Created by Rubatharisan Thirumathyam
 */

/* Required packages to run index.js */
// Express - doing our routes and API
var express = require('express');

var app = express();

// Http - serving our server
var http = require('http').Server(app);

var io = require('socket.io').listen(3001);

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');
var wutil = require('./lib/wutil');
var Queue = require('bull');

// body parsing tool for method POST - json
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


/* Booting up our webserver */
http.listen(3000, function(){
    console.log("*** Booting index.js ***");
    console.log('* listening on *:3000 *');
    wedis.flushdb(function(){
        console.log("* Redis flushed *");
    });

});

/* Lets serve our public folder for people doing GET request to / */
app.use(express.static('public'));


/* Route: [POST]/crawl */
app.post('/crawl', function(req, res){

    var sessionId = wutil.randomStringAsBase64(24);
    var queueId = wutil.randomStringAsBase64(12);

    var sessionData = {
        'sessionId' : sessionId,
        'email': req.body.email,
        'domain': req.body.domain,
        'queueId': queueId,
        'workers': req.body.workers,
        'tests': req.body.tests.toString()
    };

    wedis.setSession(sessionData, function(){
        wedis.addToCrawlersQueue(sessionData, function(){
            res.send(sessionData);
        });
    });

});

app.post('/request', function(req, res){
    wedis.getMeta(req.body.link, res);
});

app.post('/setup/socket', function(req, res){
    var sessionId = req.body.sessionId;
    var nsp = io.of('/' + sessionId);
    res.sendStatus(200);
    io.of('/' + req.body.sessionId).emit('message', 'hi' );
});

var messageQueue = Queue('messages', 6379, '194.135.92.191');

messageQueue.process(function(job, done){

    io.of('/' + job.data.sessionId).emit('message', job.data );

    done();
});

