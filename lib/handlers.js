var twilio = require('twilio');
var winston = require('winston');
var _ = require('lodash');

var models = require('./models');
var User = models.User;
var Choice = models.Choice;
var PendingVote = models.PendingVote;

/**
 * Register a vote for a pending vote and remove the pending vote.
 *
 * Callback takes four arguments: err, user, choice, vote.
 */
var handlePendingVote = function(err, pendingVote, user, vote, callback) {
  if (err) {
    winston.error(err);
    if (callback) {
      callback(err);
    }
  }
  else if (pendingVote === null) {
    winston.error("Couldn't find pending vote for user " + user.name);
    // TODO: What's the appropriate way to call the callback here?
  }
  else {
    Choice.findById(pendingVote.choiceId, function(err, choice) {
      choice.votes.push({
        userId: user.id,
        value: vote
      });
      choice.save(function(err) {
        winston.info("Recorded vote of " + vote + " for user " + user.name + " and choice '" + choice.name + "'");
        if (!err) {
          PendingVote.findByIdAndRemove(pendingVote._id, function(err) {
            if (err) {
               winston.error("Error removing pending vote " + pendingVote._id);
               winston.error(err);
               if (callback) {
                 callback(err);
               }
            }
            // Success!
            if (callback) {
              callback(null, user, choice, vote);
            }
          });
        }
      });
    });
    return;
  }
};

var handleSMS = function(req, res) {
  var twiml = new twilio.TwimlResponse();
  var msg = req.body;
  var body = msg.Body.trim();
  var bodyLc = body.toLowerCase();
  var phone = msg.From;

  User.findOne({ phone: phone }, function(err, user) {
    var voteHandler; 
    if (user === null) {
      twiml.message("This program doesn't know about you. Ask someone to set you up");
      res.status(200).send(twiml.toString());
      return;
    }

    if (bodyLc === 'yes' || bodyLc === 'no') {
      voteHandler = _.partialRight(handlePendingVote, user, bodyLc, null);
      // TODO: Make sure findOne returns oldest pending vote
      PendingVote.findOne({
        userId: user._id
      },
      {},
      {
        sort: {'date': 'asc'}
      }, voteHandler);
      return;
    }

    models.createChoice(body, function(err, choice) {
      if (err) {
        winston.error(err.message);
        twiml.message(err.message);
        res.status(200).send(twiml.toString());
      }
      else {
        msg = 'Choice "' + choice.name + '" has been added. Thanks!';
        winston.log(msg);
        twiml.message(msg);
        res.status(201).send(twiml.toString());
      }
    });
    return;
  });
};

exports.handleSMS = handleSMS;
exports.handlePendingVote = handlePendingVote;
