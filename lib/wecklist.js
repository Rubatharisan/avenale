// Wedis - our custom library to handle redis
var wedis = require('./lib/wedis');

var wecklist = {
    run : function(url, callback){
        console.log(url);

    }
}

Object.freeze(wecklist);

module.exports = wecklist;
