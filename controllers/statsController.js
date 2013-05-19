var os = require('os');
    helpers = require('../helpers/helpers');

exports.serverinfo = function(req, res, next) {
    var response_json = {
        uptime   : helpers.secondsToString(os.uptime()),
        loadavg  : os.loadavg(),
        totalmem : os.totalmem(),
        freemem  : os.freemem()
    };

    res.contentType('application/json');
    res.end(JSON.stringify(response_json));
};