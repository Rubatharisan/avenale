var service = {
    do: function($, urlData, wedis){
        var issues = {};

        if(urlData.httpCode.charAt(0) == "4"){
            issues.client_error = "Client error";
            issues.client_error_code = urlData.httpCode;
        }

        return issues;


    },

    for: function(){
        return '/';
    }
};

module.exports = service;
