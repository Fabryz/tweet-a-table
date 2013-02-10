var mongoose     = require('mongoose'),
    fs           = require('fs'),
    path         = require('path'),
    env          = process.env.NODE_ENV,
    database_url = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../configs/database_'+ env +'.json'), 'utf8')).mongodb_url,
    database     = mongoose.createConnection(database_url);

var user_schema = require('../models/Tweet'),
    Tweet = database.model('Tweet', user_schema);

/*

exports.index = function(req, res, next) {
  Tweet.find(function(err, tweets) {
    if (err) {
      console.log(err);
      return next();
    }

    return res.render('admin/user/list', { title: 'Tweet list', tweets: tweets });
  });

};

exports.show_edit = function(req, res, next) {
  var id = req.params.id;

  Tweet.findById(id, function(err, tweet) {
    if (err) {
      console.log(err);
      // return next(err);
    }

    if (tweet) {
      return res.render('admin/tweet/show_edit', { title: 'Edit Tweet', tweet: tweet, info: req.session.info });
    } else {
      return res.send(404, 'Tweet not found');
    }

  });

};

exports.update = function(req, res, next) {
  var id = req.params.id;

  var nombre      = req.body.nombre       || '';
  var descripcion = req.body.descripcion  || '';
  var precio      = req.body.precio       || '';

  // Validemos que nombre o descripcion no vengan vacíos
  if ((nombre=== '') || (descripcion === '')) {
    console.log('ERROR: Campos vacios');
    return res.send('Hay campos vacíos, revisar');
  }

  // Validemos que el precio sea número
  if (isNaN(precio)) {
    console.log('ERROR: Precio no es número');
    return res.send('Precio no es un número !!!!!');
  }

  Tweet.findById(id, function(err, tweet) {
    if (err) {
      console.log(err);
      return next(err);
    }

    if (!user) {
      console.log('ERROR: ID no existe');
      return res.send('ID Inválida!');
    } else {
      user.nombre       = nombre
      user.descripcion  = descripcion
      user.precio       = precio

      user.save(function(err) {
        if (err) {
          console.log(err);
          return next(err);
        }

        req.session.info = 'Tweet has been updated!';

        return res.redirect('/admin/user/'+ id);
      });
    }
  });
  
};


exports.remove = function(req, res, next) {
  var id = req.params.id

  Tweet.findById(id, function(err, user) {
    if (err) {
      console.log(err);
      return next(err);
    }

    if (!user) {
      return res.send('Invalid ID. (De algún otro lado la sacaste tú...)');
    }

    user.remove(function(err) {
      if (err) {
        console.log(err);
        return next(err);
      }

      return res.redirect('/admin/users');
    });
  });
  
};

exports.new = function(req, res, next) {
  return res.render('admin/user/new', {title: 'Nuevo Tweet' });
};

*/


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
    hashtags : JSON.stringify(hashtags),
    content  : JSON.stringify(data)
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
    // LEGACY in early stages Tweet table didn't have the row hashtags
    // but as we stored the whole tweet in the content field
    // we can extract the row from entities.hashtags

    // var hashtags = tweets[i].hashtags;
    // if (!hashtags) {
    //   var json = JSON.parse(tweets[i].content);
    //   hashtags = json.entities.hashtags;
    // }

    parsed.push({
      id_str     : tweets[i].id_str,
      hashtags   : tweets[i].hashtags,
      created_at : tweets[i].created_at
    });
  }

  return parsed;
}

exports.api = function(req, res, next) {
  var marker_start = Date.now(),
      marker_end = '';

  console.log('* Received API Request...');

  Tweet.find().lean().exec(function(err, tweets) {
    if (err) {
      console.log(err);

      return next();
    }

    marker_end = Date.now();
    console.log('* ...answered API Request ('+ (marker_end - marker_start) +'ms)');

    tweets = parseTweets(tweets);

    res.contentType('application/json');
    res.end('{ "tweets" : '+ JSON.stringify(tweets) +' }');
  });

};
