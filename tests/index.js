var tests = {}

var normalizedPath = require("path").join(__dirname, "cases");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
    var test = require("./cases/" + file);
    tests[file] = test;
});

var service = {
    do: function(arrayOfTests, $, link, wedis){
        var issues = {};

        for(var test in arrayOfTests){
            var result = tests[arrayOfTests[test]].do($, link, wedis);
            if(Object.keys(result).length !== 0){
                issues[arrayOfTests[test]] = result;
            }
        }

        return issues;
    }
};

module.exports = service;


/* checkTests(
    { lupus: 'bar', cancer: 'baz', hiv: 'foo' },
    ['hiv', 'lupus', 'cancer']
).then(function (results) {
        return console.log(results);
});







*/







/* var tests = {};

 tests.hiv = function (data) {
 return Promise.resolve(data.hiv);
 };

 tests.lupus = function (data) {
 return Promise.resolve(data.lupus);
 };

 tests.cancer = function (data) {
 return Promise.resolve(data.cancer);
 };

 */
