var service = {
    do: function($, urlData, wedis){
        var issues = {};

        if(urlData.headers['content-length'] > 4000){
            issues.image_too_large = "Size: " + urlData.headers['content-length'];

        }

        return issues;


    },

    for: "image"
};

module.exports = service;
