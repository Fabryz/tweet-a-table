/*
* Requirements
*/

var express = require('express'),
    socketio = require('socket.io'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    access_logfile = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' }),
    Tuiter = require('tuiter'),
    helpers = require('./helpers/helpers'),
    tweet_manager = require('./controllers/tweet_manager'),
    statsController = require('./controllers/statsController'),
    tweetsQueue = [],
    tweetsQueueMaxSize = 3;

var app = express();

/*
* Configurations
*/

app.configure(function() {
    app.set('port', process.env.PORT || 8080);
    app.use(express.favicon());
    app.use(express.logger('short'));
    app.use(express.logger({ stream: access_logfile }));
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

// all environments
app.configure(function() {

});

// development only
app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// production only
app.configure('production', function() {
    app.use(express.errorHandler());
});

/*
* Express
*/

app.get('/', function(req, res) {
    res.sendfile(path.join(__dirname, 'public/index.html'));
});

app.get('/uptime', function(req, res) {
    var uptime = helpers.secondsToString( process.uptime().toString() );

    res.end('The server has been up for: '+ uptime );
});

// app.get('/stats', tweet_manager.stats);
app.get('/count', tweet_manager.count);
// app.get('/tweets', tweet_manager.tweets);
app.get('/occurences', tweet_manager.occurences);

app.get('/serverinfo', statsController.serverinfo);

app.get('/restart', function(req, res) {
    console.log(' * Restarting in 5 seconds... * ');
    setTimeout(function() {
        tu = '';
        grabTwitterFeed();
        console.log(' * Triggered restart * ');
        res.redirect('/');
    }, 5000);
});

/*
* Functions
*/

function createParamsFile() {

    console.log("dir " + path.join(__dirname, 'configs', 'keywords.json'));

    var keywords = helpers.readJSONFile(path.join(__dirname, 'configs', 'keywords.json'));
    stream.options = keywords.options.split(',');
    stream.events = keywords.events.split(',');

    var value = '';

    // Add the single events first
    if (keywords.events) {
        value += keywords.events +',';
    }

    // Then compose event param1,event param2...
    if (keywords.options) {
        stream.options.forEach(function(opt) {
            stream.events.forEach(function(ev) {
                if (ev && opt) {
                    value += ev +' '+ opt +',';
                } else if (ev) {
                    value += ev +',';
                } else if (opt) {
                    value += opt +',';
                }
            });
        });
    }
    value = value.substring(0, value.length - 1); // remove last ,

    var params = {
        'param': keywords.param,
        'value': value
    };

    helpers.writeJSONFile(path.join(__dirname, 'configs', 'params.json'), params);

    console.log("* Params.json created with: "+ JSON.stringify(params));
}

function readConfigs() {
    var env = process.env.NODE_ENV,
        twitterConfigs = helpers.readJSONFile(path.join(__dirname, 'configs', 'twitter_'+ env +'.json')),
        paramsConfigs = helpers.readJSONFile(path.join(__dirname, 'configs', 'params.json'));

    return {
        twitterApp : twitterConfigs,
        param : paramsConfigs.param,
        value : paramsConfigs.value
    };
}

function strencode(data) {
    return unescape(encodeURIComponent(JSON.stringify(data)));
}

// Using Twitter Streaming API
function grabTwitterFeed() {

    tu = new Tuiter(configs.twitterApp);

    tu.filter({ track: configs.value.split(',') }, function(feed) {
        console.log('* Stream started');

        feed.on('tweet', function(tweet) {
            // if (process.env.NODE_ENV == "development") { // DEBUG
            //     console.log(tweet.created_at +' '+ JSON.stringify(tweet.entities.hashtags)); // DEBUG tweets
            // }

            // Puts the tweet on queue
            if (tweetsQueue.length < (tweetsQueueMaxSize - 1)) {
                tweetsQueue.push(tweet);

                if (process.env.NODE_ENV == "development") { // DEBUG
                    process.stdout.write(".");
                }
            } else {
                tweetsQueue.push(tweet);

                 // If the queue is full save to DB, then empty it
                var length = tweetsQueue.length;
                for (var i = 0; i < length; i++) {
                    tweet_manager.create(tweetsQueue[i]);
                }
                if (process.env.NODE_ENV == "development") { // DEBUG
                    process.stdout.write("O");
                }

                tweetsQueue = [];
            }

            // Send only tweets with geo info
            // if (tweet.geo) {
                // io.sockets.emit("tweet", strencode(tweet));
            // }
        });

        feed.on('error', function(err) {
            console.log(err);
        });
    });
}

/*
* Main
*/

var totUsers = 0;

var stream = {
    leaderboard: [],
    events: {},
    options: {},
    createdAt: '',
    updatedAt: ''
};

var tu = '',
    configs = readConfigs();

createParamsFile();

grabTwitterFeed(); // UNCOMMENT ME TO START

// var interval = setInterval(function() {
//   tu = '';
//   grabTwitterFeed();
//   console.log(' * 5 mins passed, autorestarted. * ');
// }, 300000); // 5 mins

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port "+ app.get('port') +" in "+ app.get('env') +" mode.");
});

/*
* Socket.io
*/

var io = socketio.listen(server);

io.configure(function() {
    io.enable('browser client minification');
    io.set('log level', 1);
});

io.sockets.on('connection', function(client) {
    totUsers++;
    console.log('+ User '+ client.id +' connected, total users: '+ totUsers);

    client.emit('clientId', { id: client.id });
    client.emit('filters', { events: stream.events, options: stream.options, createdAt: stream.createdAt });
    io.sockets.emit('tot', { tot: totUsers });

    io.sockets.emit('leaderboard', strencode(stream.leaderboard));

    client.on('disconnect', function() {
        totUsers--;
        console.log('- User '+ client.id +' disconnected, total users: '+ totUsers);

        io.sockets.emit('tot', { tot: totUsers });
    });
});
