var service = {
    do: function($, urlData, wedis){
        var issues = {};

        if(urlData.httpCode == "404"){
            issues.page_not_found = "Missing";

        }

        return issues;


    },

    for: function(){
        return '/';
    }
};

module.exports = service;
