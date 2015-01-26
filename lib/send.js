var util = require('util');
var EventEmitter = require('events').EventEmitter;

var async = require('async');
var moment = require('moment');
var winston = require('winston');

var conf = require('./conf');
var models = require('./models');
var Choice = models.Choice;
var User = models.User;
var PendingVote = models.PendingVote;

var Sender = function(opts) {
  opts = opts || {};
  // Time to wait as duration 
  this.wait = opts.wait;
  this._shouldSendFn = opts.shouldSend;
  this._maxVotes = opts.maxVotes;
};

util.inherits(Sender, EventEmitter);

Sender.prototype.sendAll = function() {
  var sender = this;
  var sendFns = [];


  User.find(function(err, users) {
    users.forEach(function(user) {
      var shouldSend;

      if (sender._shouldSendFn) {
        shouldSend = sender._shouldSendFn(sender, user);
      }
      else {
        shouldSend = sender.shouldSend(user);
      }

      if (!shouldSend) {
        return;
      }

      sendFns.push(function(callback) {
        Choice.forUser(user, sender._maxVotes, function(err, choice) {
          if (!choice) {
            callback();
            return;
          }

          sender.send(user, choice, function() {
            callback();
          });
        });
      });

    });

    async.parallel(sendFns, function(err, results) {
      sender.emit('done');
    });
  });   
};

Sender.prototype.shouldSend = function(user) {
  var now = moment();
  var lastSent;
  var sinceLastSent;

  if (!user.lastSent) {
    return true;
  }

  sinceLastSent = moment.duration(now.diff(moment(user.lastSent)), 'ms');

  if (sinceLastSent < this.wait) {
    return false;
  }
  
  return true;
};

Sender.prototype.send = function(user, choice, callback) {
  var client = require('twilio')(conf.get('TWILIO_ACCOUNT_SID'),
    conf.get('TWILIO_AUTH_TOKEN'));
  var msg = choice.name + "\n\n" + "Reply with yes or no to vote\n\n";

  PendingVote.create({userId: user._id, choiceId: choice._id}, function(err, pendingVote) {
    if (err) {
      winston.error(err);
      callback(err);
      return;
    }

    client.messages.create({
      body: msg, 
      to: user.phone,
      from: conf.get('TWILIO_PHONE_NUMBER')
    },
    function(err, message) {
      if (err) {
        winston.error(err);
        callback(err);
      }
      else {
        user.lastSent = new Date();
        user.save(function(err) {
          if (err) {
            winston.error(err);
            callback(err);
          }
          else {
            winston.info('Sent "' + choice.name + '" to ' + user.name);
            callback();
          }  
        });
      }
    });
  });

};

exports.Sender = Sender;
