var service = {
    do: function($, urlData, wedis){
        var issues = {};

        if(urlData.httpCode.charAt(0) == "5"){
            issues.server_error = "Server error";
            issues.server_error_code = httpCode;
        }

        return issues;


    },

    for: function(){
        return '/';
    }
};

module.exports = service;
