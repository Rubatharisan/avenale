var service = {
    do: function($, link, wedis){
        var issues = {};


        if($('h2').length === 0){

            // count paragraph words
            var paragraphCount = 0;
            $('p').each(function(i) {
                paragraphCount = paragraphCount + $(this).text().split(' ').length;
            });

            if(paragraphCount < 100){
                issues.missing_h2 = "Missing a h2 tag";
            }

        }

        if($('h2').length > 0){
            $('h2').each(function(){
               if($(this).text().length < 4){
                   issues.h2_tag_too_short = "a h2 tag too short";
               }
            });
        }

        return issues;
    }
};

module.exports = service;
