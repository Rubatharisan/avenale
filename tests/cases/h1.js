var service = {
    do: function($, link, wedis){
        var issues = {};

        if($('h1').length === 0){
            issues.missing_h1 = "Missing a h1 tag";
        }

        if($('h1').length > 1){
            issues.too_many_h1 = "There is too many h1 tags";
        }


        if($('h1').length === 1){

            if($('h1').text().length < 4){
                issues.h1_tag_too_short = "The h1 tag is too short";
            }

        }

        return issues;
    }
};

module.exports = service;
