const cluster = require('cluster');
var Queue = require('bull');


var numWorkers = 8;
var queue = new Queue("Hello world");

if(cluster.isMaster){

    for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', function(worker) {
        // Lets create a few jobs for the queue workers
        for(var i=0; i<500; i++){
            console.log("adding elements");
            queue.add({foo: 'bar'});
        };
    });

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
    });

}else{

    queue.process(function(job, jobDone){
        console.log("Job done by worker", cluster.worker.id, job.jobId);
        jobDone();
    });
}