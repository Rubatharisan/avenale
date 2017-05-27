var service = {
    do: function($, link, wedis, meta, httpCode){
        var issues = {};

        if(httpCode.charAt(0) == "5"){
            issues.server_error = "Server error";
            issues.server_error_code = httpCode;
        }

        return issues;


    }
};

module.exports = service;
