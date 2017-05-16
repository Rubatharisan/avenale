var service = {
    do: function($, link, wedis){
        console.log("Inside 500!", $('a').length, link);
        wedis.exists(link, function(reply){
            console.log("Inside 500 - exists ", link, reply)
        })
    }
};

module.exports = service;
