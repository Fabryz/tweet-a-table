var mongoose     = require('mongoose'),
    fs           = require('fs'),
    path         = require('path');

var env          = process.env.NODE_ENV,
    database_url = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../configs/database_'+ env +'.json'), 'utf8')).mongodb_url,
    database     = mongoose.createConnection(database_url);

var user_schema = require('../models/Tweet'),
    Tweet = database.model('Tweet', user_schema);

function lowercaseHashtags(hashtags) {
  var parsed = [];

  var length = hashtags.length;
  for (var i = 0; i < length; i++) {
    parsed.push(hashtags[i].text.toLowerCase());
  }

  return parsed;
}

function contains(arr, obj) {
  var length = arr.length;
  for (var i = 0; i < length; i++) {
    if (arr[i] === obj) {
      return true;
    }
  }
  return false;
}

function parseTweetForHashtags(hashtags) {
  var parsed = [];

  hashtags = lowercaseHashtags(hashtags);

  var length = hashtags.length;
  for (var i = 0; i < length; i++) {
     // if (!contains(stream.events, hashtags[i].toLowerCase().substring(1))) {
       parsed.push(hashtags[i]);
     // }
   }

   return parsed;
}

exports.create = function(data) {
  var hashtags = parseTweetForHashtags(data.entities.hashtags);

  var tweet = new Tweet({
    id_str   : data.id_str,
    tweet    : JSON.stringify(data),
    hashtags : JSON.stringify(hashtags)
  });

  tweet.save(function(err) {
    if (err) {
      console.log(err);

      if (err.message.indexOf('E11000 ') !== -1) {
        // this _id was already inserted in the database
        console.log('Error while creating the tweet: duplicated entry.');
      } else {
        return next(err);
      }
    }

  });
};

function parseTweets(tweets) {
  var parsed = [];

  var length = tweets.length;
  for (var i = 0; i < length; i++) {

    parsed.push({
      id_str     : tweets[i].id_str,
      hashtags   : tweets[i].hashtags,
      created_at : tweets[i].created_at
    });
  }

  return parsed;
}

function orderByValue(obj) {
    var tuples = [];

    for (var key in obj) {
      tuples.push([key, obj[key]]);
    }

    tuples.sort(function(a, b) {
      return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
    });

    return tuples;
}

function sortArrayByValueDesc(obj) {
    var tuples = [];

    for (var key in obj) {
      tuples.push({ hash: key, count: obj[key] });
    }

    tuples.sort(function(a, b) {
      return (a.count < b.count ? 1 : a.count > b.count ? -1 : 0);
    });

    return tuples;
}

// TODO from DATE to DATE span
function generateOccurrences(tweets) {
  var parsed = [];

  var length = tweets.length;
  for (var i = 0; i < length; i++) {
    var hashtags = JSON.parse(tweets[i].hashtags);

    hashtags.forEach(function(hash) {
      if (!parsed[hash]) {
        parsed[hash] = 0;
      }
      parsed[hash] = parsed[hash] + 1;
    });

  }

  parsed = sortArrayByValueDesc(parsed);

  return parsed;
}

// FIXME remove duplicated code
exports.stats = function(req, res, next) {
  var marker_start = Date.now(),
      marker_end = '';

  console.log('* Received STATS Request...');

  Tweet.find().select('_id id_str hashtags created_at').lean().exec(function(err, tweets) {
    if (err) {
      console.log(err);

      return next();
    }

    Tweet.find({}).select('created_at').sort({ created_at: 1 }).limit(1).lean().exec(function(err, date_start) {
      if (err) {
        console.log(err);

        return next();
      }

      Tweet.find({}).select('created_at').sort({ created_at: -1 }).limit(1).lean().exec(function(err, date_end) {
        if (err) {
          console.log(err);

          return next();
        }

        Tweet.count().lean().exec(function(err, total_tweets) {
          if (err) {
            console.log(err);

            return next();
          }

          var occurrences = generateOccurrences(tweets);

          var response_json = {
            occurrences  : JSON.stringify(occurrences),
            date_start   : date_start[0].created_at,
            date_end     : date_end[0].created_at,
            total_tweets : total_tweets
          };

          res.contentType('application/json');
          res.end(JSON.stringify(response_json));

          marker_end = Date.now();
          console.log('* ...answered STATS Request ('+ (marker_end - marker_start) +'ms)');

        });

      });

    });

  });

};

// FIXME function ALREADY used in server.js, stop duplicating
function readJSONFile(filename) {
  var JSONFile = '';

  try {
    JSONFile = JSON.parse(fs.readFileSync(__dirname +'/'+ filename, 'utf8'));
  } catch(e) {
    console.log('Error while reading '+ filename +': '+ e);
  }

  return JSONFile;
}

function getKeywords() {
  var keywords_json = readJSONFile('../configs/keywords.json');
  var keywords = keywords_json.options.split(',');

  var length = keywords.length;
  for (var i = 0; i < length; i++) {
    keywords[i] = keywords[i].substring(1); // removes the #
  }

  return keywords;
}
