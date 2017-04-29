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


/* Booting up our webserver */
http.listen(3000, function(){
    console.log("*** Booting index.js ***");
    console.log('* listening on *:3000 *');
    console.log('* Flushing RedisDB *');
    wedis.flushdb();
});


/* Route: [GET]/addJob/ */
app.get('/test', function (req, res) {
    crawlersQueue.add({link: 'http://morningtrain.dk'});
    res.send('hello world')
})


var crawlersQueue = Queue('crawlers', 6379, '127.0.0.1');
