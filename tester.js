var wedis = require('./lib/wedis');

wedis.getset('testing', function(reply, err){
    console.log("reply", reply);
    console.log("error", err);
    if(!reply){
        console.log("H!I");
    }
})