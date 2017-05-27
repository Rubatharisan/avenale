var service = {
    do: function($, link, wedis){
        var issues = {};

        $("p:contains('Karsten'), h1:contains('Karsten'), h2:contains('Karsten'), h3:contains('Karsten'), h4:contains('Karsten')").each(function(){
            issues.page_contains_karsten = "Yes it does";
        });

        return issues;
    }
};

module.exports = service;
