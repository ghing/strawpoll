var twilio = require('twilio');
var winston = require('winston');

var models = require('./models');
var User = models.User;
var Choice = models.Choice;
var PendingVote = models.PendingVote;

var handleSMS = function(req, res) {
  var twiml = new twilio.TwimlResponse();
  var msg = req.body;
  var body = msg.Body.trim();
  var bodyLc = body.toLowerCase();
  var phone = msg.From;

  User.findOne({ phone: phone }, function(err, user) {
    if (user === null) {
      twiml.message("This program doesn't know about you. Ask someone to set you up");
      res.status(200).send(twiml.toString()); 
      return;
    }

    if (bodyLc === 'yes' || bodyLc === 'no') {
      PendingVote.findOne({
        userId: user._id
      },
      {},
      {
        sort: {'date': 'asc'}
      }, function(err, pendingVote) {
        if (err) {
          winston.error(err);
        }
        else if (pendingVote === null) {
          winston.error("Couldn't find pending vote for user " + user.name);
        }
        else {
          Choice.findById(pendingVote.choiceId, function(err, choice) {
            choice.votes.push({
              userId: user.id,
              value: bodyLc 
            });
            choice.save(function(err) {
              winston.info("Recorded vote of " + bodyLc + " for user " + user.name + " and choice '" + choice.name + "'");
              if (!err) {
                PendingVote.findByIdAndRemove(pendingVote._id, function(err) {
                });
              }
            });
          });
        }
      });  
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
