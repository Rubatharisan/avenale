var io = require('socket.io').listen(3001);

var messageQueue = Queue('messages', 6379, '194.135.92.191');

messageQueue.process(function(job, done){
    io.of('/' + job.data.sessionId).emit('message', job.data );
    done();
});