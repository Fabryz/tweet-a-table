var express = require('express'),
fs = require('fs'),
Tuiter = require('tuiter'),
app = module.exports = express.createServer();

var tweet_manager = require('./controllers/tweet_manager');

/*
* Configurations
*/

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger(':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
  app.use(express.favicon());
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

function secondsToString(seconds) {
	var numDays = Math.floor(seconds / 86400);
	var numHours = Math.floor((seconds % 86400) / 3600);
	var numMinutes = Math.floor(((seconds % 86400) % 3600) / 60);
	var numSeconds = Math.floor((seconds % 86400) % 3600) % 60;

	return numDays +' days '+ numHours +' hours '+ numMinutes +' minutes '+ numSeconds +' seconds.';
}

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

app.get('/about.html', function(req, res) {
	res.sendfile('about.html');
});

app.get('/archive/euro2012.html', function(req, res) {
	res.sendfile('archive/euro2012.html');
});

app.get('/archive/london2012.html', function(req, res) {
	res.sendfile('archive/london2012.html');
});

app.get('/api', tweet_manager.api);

app.get('/stats', tweet_manager.stats);

app.get('/graph', tweet_manager.graph);

app.get('/uptime', function(req, res) {
	res.end('The server has been up for: '+ secondsToString( process.uptime().toString() ) );
});

// app.get('/resetdb', function(req, res) {
//	createDb();
//	console.log('Db has been resetted.');
//	res.redirect('/');
// });

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
* Main
*/

var	totUsers = 0;

var stream = {
	leaderboard: [],
	events: {},
	options: {},
	createdAt: '',
	updatedAt: ''
};

var tu = '',
configs = readConfigs();

//createParamsFile();
// checkDb();

app.listen(8080);

grabTwitterFeed();

// var interval = setInterval(function() {
//   tu = '';
//   grabTwitterFeed();
//   console.log(' * 5 mins passed, autorestarted. * ');
// }, 300000); // 5 mins

console.log('Express server listening in %s mode', app.settings.env);

/*
* Functions
*/

function resetDb() {
	var now = new Date();
	stream.createdAt = now;
	stream.updatedAt = now;

	stream.leaderboard = [];
	stream.options.forEach(function(opt) {
		stream.leaderboard.push({ option: opt.substring(1), count: 0 });
	});
}

function createDb() {
	resetDb();

  writeJSONFile('db.json', stream);
}

function checkDb() {
	fs.stat(__dirname +'/db.json', function(err, stat) {
		if (err === null) { // file exists
			loadDb();
		} else if (err.code == 'ENOENT') { // file doesn't exist
   createDb();
 } else {
   console.log('Error while reading the database file: '+ err.code);
 }
});
}

function loadDb() {
	stream = readJSONFile('db.json');
	orderLeaderboard();
}

function saveDb() {
	orderLeaderboard();
	stream.updatedAt = new Date();
	writeJSONFile('db.json', stream);
}

// return require('./filename-with-no-extension'); could be used
function readJSONFile(filename) {
	var JSONFile = '';
	
	try {
		JSONFile = JSON.parse(fs.readFileSync(__dirname +'/'+ filename, 'utf8'));
	} catch(e) {
		console.log('Error while reading '+ filename +': '+ e);
	}

	return JSONFile;
}

function writeJSONFile(filename, contents) {
	try {
		fs.writeFileSync(__dirname +'/'+ filename, JSON.stringify(contents), 'utf8');
	} catch(e) {
		console.log('Error while writing '+ filename +': '+ e);
	}
}

function createParamsFile() {
	var keywords = readJSONFile('./configs/keywords.json');
	stream.options = keywords.options.split(',');
	stream.events = keywords.events.split(',');

	var value = '';
	stream.options.forEach(function(opt) {
		stream.events.forEach(function(ev) {
			value += ev +' '+ opt +',';
		});
	});
	value = value.substring(0, value.length - 1); // remove last ,

	var params = {
		'param': keywords.param,
		'value': value
	};

	writeJSONFile('./configs/params.json', params);
}

function readConfigs() {
  var env = process.env.NODE_ENV,
    twitterConfigs = readJSONFile('./configs/twitter_'+ env +'.json'),
    paramsConfigs = readJSONFile('./configs/params.json');

  return {
    twitterApp : twitterConfigs,
    param : paramsConfigs.param,
    value : paramsConfigs.value
  };
}

function strencode(data) {
  return unescape(encodeURIComponent(JSON.stringify(data)));
}

function SortByCountDesc(a, b) {
	a = a.count;
	b = b.count;
	return ((a < b) ? 1 : ((a > b) ? -1 : 0));
}

function orderLeaderboard() {
	stream.leaderboard.sort(SortByCountDesc);
}

function elaborateStats(hashtags) {
   hashtags.forEach(function(hash) {
    stream.leaderboard.forEach(function(item) {
     if (item.option == hash) {
      item.count++;

      saveDb();

				// console.log(item.option +' has now '+ item.count);
			}
		});
  });
}

// Using Twitter Streaming API
function grabTwitterFeed() {
	tu = new Tuiter(configs.twitterApp);

	tu.filter({ track: configs.value.split(',') }, function(feed) {
		console.log(' * Stream started * ');

		feed.on('tweet', function(tweet) {
			// var hashtags = parseTweetForHashtags(tweet.entities.hashtags);
			//elaborateStats(hashtags);

      tweet_manager.create(tweet);

      //if (process.env.NODE_ENV == "development") {
        console.log(tweet.created_at +' '+ JSON.stringify(tweet.entities.hashtags));
      //}

			//io.sockets.emit('leaderboard', strencode(stream.leaderboard));
		});

		feed.on('error', function(err) {
			console.log(err);
		});
	});
}

/*
* Socket.io
*/

var io = require('socket.io').listen(app);

io.configure(function() {
	io.enable('browser client minification');
	io.set('log level', 1);
	io.set('transports', [
   'websocket',
   'flashsocket',
   'htmlfile',
   'xhr-polling',
   'jsonp-polling'
   ]);
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