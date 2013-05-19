var fs = require('fs');

exports.secondsToString = function(seconds) {
    var numDays = Math.floor(seconds / 86400);
    var numHours = Math.floor((seconds % 86400) / 3600);
    var numMinutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var numSeconds = Math.floor((seconds % 86400) % 3600) % 60;

    return numDays +' days '+ numHours +' hours '+ numMinutes +' minutes '+ numSeconds +' seconds.';
};

// return require('./filename-with-no-extension'); could be used
exports.readJSONFile = function(filename) {
    var JSONFile = '';

    try {
        JSONFile = JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch(e) {
        console.log('Error while reading '+ filename +': '+ e);
    }

    return JSONFile;
};

exports.writeJSONFile = function(filename, contents) {
    try {
        fs.writeFileSync(filename, JSON.stringify(contents), 'utf8');
    } catch(e) {
        console.log('Error while writing '+ filename +': '+ e);
    }
};
