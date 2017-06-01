var cases = {}

var normalizedPath = require("path").join(__dirname, "cases");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
    var theCase = require("./cases/" + file);
    cases[file] = theCase;
});

var service = {
    do: function(urlData, $, link, wedis){

        var issues = {};

        for(var currentCase in urlData.requiredTests){

            var caseAction = cases[urlData.requiredTests[currentCase]];

            if(urlData.headers['content-type'].indexOf(caseAction.for) >= 0){
                var result = caseAction.do($, urlData, wedis);

                if (Object.keys(result).length !== 0) {
                    issues[urlData.requiredTests[currentCase]] = result;
                }

            }
        }

        return issues;
    }
};

module.exports = service;