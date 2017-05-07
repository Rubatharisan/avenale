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

// Bull - our queue library
var Queue = require('bull');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

var crypto = require('crypto');
var base64url = require('base64url');


// body parsing tool for method POST - json
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


/* Booting up our webserver */
http.listen(3000, function(){
    console.log("*** Booting index.js ***");
    console.log('* listening on *:3000 *');
    console.log('* Flushing RedisDB *');
    //wedis.flushdb();
});

app.use(express.static('public'));


/* Route: [POST]/crawl */
app.post('/crawl', function(req, res){
    wedis.flushdb();

    var sessionId = randomStringAsBase64Url(24);
    var queueId = randomStringAsBase64Url(12);

    var sessionData = {
        'sessionId' : sessionId,
        'email': req.body.email,
        'domain': req.body.domain,
        'queueId': queueId
    };

    wedis.setSession(sessionData, function(){
        crawlersQueue.add(sessionData);

        res.send(sessionData);
    });

});

app.post('/request', function(req, res){
    console.log(req.body);
    console.log(req.body.link);
    wedis.getMeta(req.body.link, res);
});




app.post('/setup/socket', function(req, res){
    var sessionId = req.body.sessionId;

    var nsp = io.of('/' + sessionId);

    res.send(200);


});

var messageQueue = Queue('messages', 6379, '127.0.0.1');
var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');


messageQueue.process(function(job, done){
    io.of('/' + job.data.sessionId).emit('message', job.data );
    done();
});

function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

/*
 Waiting queue:
 1) "bull:crawlers:wait"
 2) "bull:crawlers:active"

 */