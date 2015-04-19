var mongoose = require('mongoose');
var should = require('should');
var sinon = require('sinon');
var _ = require('lodash');

var app = require('../lib/app');
var conf = require('../lib/conf');
var models = require('../lib/models');
var handlers = require('../lib/handlers');
var Choice = models.Choice;
var User = models.User;
var PendingVote = models.PendingVote;

// Connect to the test database
mongoose.connect(conf.get('STRAWPOLL_TEST_MONGO_CONNECTION_STRING'), function(err) {});

describe('handlers', function() {
  describe('#handlePendingVote()', function() {
    var users;
    var choices;
    var pendingVotes;

    beforeEach(function(done) {
      var userProps = [
        {
          name: 'Test User',
          phone: '+11234567890'
        }
      ];
      var choiceNames = [
        'Name 1',
        'Name 2'
      ];
      var choiceProps = choiceNames.map(function(name) {
        return {
          'name': name
        };
      });

      pendingVotes = [];

      models.User.create(userProps, function(err, userModels) {
        if (err) {
          done(err);
        }  
        if (userModels.length) {
          users = userModels;
        }
        else {
          users = [userModels];
        }  
        models.Choice.create(choiceProps, function(err, choiceModels) {
          if (err) {
            done(err);
          }  
          if (choiceModels.length) {
            choices = choiceModels;
          }  
          else {
            choices = [choiceModels];
          }  
          PendingVote.create({
            userId: users[0]._id,
            choiceId: choices[0]._id
          }, function(err, pendingVote) {
            if (err) {
              done(err);
            }  
            pendingVotes.push(pendingVote);
            done();
          });
        });
      });
    });

    afterEach(function(done) {
      var userIds = users.map(function(user) {
        return user.id;
      });
      var choiceIds = choices.map(function(choice) {
        return choice.id;
      });
      var pendingVoteIds = pendingVotes.map(function(pv) {
        return pv.id;
      });

      User.remove({
        '_id': {
          $in: userIds
        }
      }, function(err, users) {
        if (err) {
          done(err);
        }
        Choice.remove({
          '_id': {
            $in: choiceIds
          }
        }, function(err, users) {
          if (err) {
            done(err);
          }
          PendingVote.remove({
          }, function(err, pvs) {
            if (err) {
              done(err);
            }

            done();
          });
        });
      });
    });

    it('should add a vote for a choice', function(done) {
      var pendingVote = pendingVotes[0];
      var choiceId = pendingVote.choiceId;
      var userId = pendingVote.userId;
      var expectedVote = 'yes';
      var callback = function(err, user, choice, vote) {
        should(user.id).equal(userId.toHexString());
        should(choice.id).equal(choiceId.toHexString());
        should(vote).equal(expectedVote);
        done();
      };
      // Use a partial here, because that's how we call handlePendingVote when
      // we really use it.
      var handler = _.partialRight(handlers.handlePendingVote, users[0], expectedVote, callback); 
      handler(null, pendingVote);
    });  

    it('should remove the pending vote', function(done) {
      var pendingVote = pendingVotes[0];
      var choiceId = pendingVote.choiceId;
      var userId = pendingVote.userId;
      var expectedVote = 'yes';
      var callback = function(err, user, choice, vote) {
        PendingVote.findOne({_id: pendingVote._id}, function(err, pv) {
          done();
        });
      };
      // Use a partial here, because that's how we call handlePendingVote when
      // we really use it.
      var handler = _.partialRight(handlers.handlePendingVote, users[0], expectedVote, callback); 
      handler(null, pendingVote);
    });

  });   
});
