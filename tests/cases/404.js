var service = {
    do: function($, link, wedis){
        var issues = {};
        console.log($('h1').length);

        if($('h1').length != 2){
            issues.h1 = "Missing";
        }

        return issues;
    }
};

module.exports = service;
