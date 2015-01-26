var _ = require('lodash');
var mongoose = require('mongoose');

var randomInt = require('./util').randomInt;
var Schema = mongoose.Schema;

var UserSchema = Schema({
  name: String,
  phone: String,
  // Date that someone was last sent a choice
  lastSent: Date
});

var User = mongoose.model('User', UserSchema);


var VoteSchema = Schema({
  userId: Schema.Types.ObjectId,
  date: { type: Date, default: Date.now },
  value: Schema.Types.Mixed
});

var ChoiceSchema = Schema({
  name: String,
  votes: [VoteSchema]
});

/**
 * Get a choice for a user.
 */
ChoiceSchema.statics.forUser = function(user, maxVotes, callback) {
  var model = this;

  // Use a MapReduce to get the number of times the user
  // has voted for a choice, if that number of votes is
  // less than maxVotes
  var mr = {
    map: function() {
      var count = 0;

      for (var i=0; i < this.votes.length; i++) {
        vote = this.votes[i];
        if (vote.userId && vote.userId.valueOf() == userId) {
          count++;
        }
      }

      if (count <= maxVotes) {
        emit(this._id, count);
      }  
    },
    reduce: function(key, values) {
      return values;
    },
    scope: {
      userId: user.id,
      maxVotes: maxVotes
    }
  };

  model.mapReduce(mr, function(err, col) {
    var randi;
    var minCount;
    var oid;
    var grouped;
    var counts;

    if (col.length === 0) {
      // There were no choices with fewer than maxVotes by
      // this user.  Return null
      callback(null, null);
      return;
    }
   
    // Group the choices by the number of times the user
    // voted for them
    grouped = _.groupBy(col, function(item) {
      return item.value;
    });  
    // Get a sorted list of the number of times a user
    // voted for a choice
    counts = _.keys(grouped).sort();

    // Select a choice randomly from amongst the
    // choices the user has seen the fewest times.
    randi = randomInt(0, grouped[counts[0]].length); 
    oid = grouped[counts[0]][randi]._id;
    model.findOne({_id: oid}, function(err, choice) {
      if (err) {
        callback(err, null);
        return;
      }

      callback(null, choice);
    });
  });
};

var Choice = mongoose.model('Choice', ChoiceSchema);

var createChoice = function(name, callback) {
  Choice.findOne({ name: name }, function(err, choice) {
    if (choice === null) {
      // Choice doesn't exist, create it.
      Choice.create({name: name}, function(err, choice) {
        if (err) {
          callback(err);
          return;
        }

        callback(null, choice);
      });
    }
    else {
      // Choice already exists
      callback(new Error('Choice ' + name + ' already exists'));
      return;
    }
  });
};


var PendingVoteSchema = Schema({
  userId: Schema.Types.ObjectId,
  choiceId: Schema.Types.ObjectId,
  date: { type: Date, default: Date.now }
});  

var PendingVote = mongoose.model('PendingVote', PendingVoteSchema);

exports.Choice = Choice;
exports.User = User;
exports.PendingVote = PendingVote;
exports.createChoice = createChoice;
