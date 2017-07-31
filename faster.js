var URI = require('urijs');

var link = URI('mailto:helox');

console.log(link.is("URL"));


console.log(link.toString());