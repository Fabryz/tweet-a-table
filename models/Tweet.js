var Schema = require('mongoose').Schema;

var tweet_schema = new Schema({
	tweet        : { type: Schema.Types.Mixed, index:true }
});

// tweet_schema.pre('save', function(next) {
//   this.updated_at = new Date;

//   next();
// });

/*
tweet_schema.post('init', function (doc) {
	console.log('%s has been initialized from the db', doc._id);
});
tweet_schema.post('validate', function (doc) {
	console.log('%s has been validated (but not saved yet)', doc._id);
});
tweet_schema.post('save', function (doc) {
	console.log('%s has been saved', doc._id);
});
tweet_schema.post('remove', function (doc) {
	console.log('%s has been removed', doc._id);
}); */

module.exports = tweet_schema;
