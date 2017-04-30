/*
Created by Rubatharisan Thirumathyam
 */

/* Required packages to run index.js */
// Express - doing our routes and API
var app = require('express')();

// Http - serving our server
var http = require('http').Server(app);

// Socket.IO - websockets
var io = require('socket.io')(http);

// Bull - our queue library
var Queue = require('bull');

// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');



// body parsing tool for method POST - json
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


/* Booting up our webserver */
http.listen(3000, function(){
    console.log("*** Booting index.js ***");
    console.log('* listening on *:3000 *');
    console.log('* Flushing RedisDB *');
    wedis.flushdb();
});

/* Route: [POST]/crawl */
app.post('/crawl', function(req, res){
    console.log(req.body);
    res.send(req.body);
    //res.send("OK!");
})

/* Route: [GET]/addJob/ */
app.get('/test', function (req, res) {
    crawlersQueue.add({link: 'http://bloomit.dk.bluebird.pw', prefix: '1'});
    res.send('hello world')
})


var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');


/*
Waiting queue:
 1) "bull:crawlers:wait"
 2) "bull:crawlers:active"

 */