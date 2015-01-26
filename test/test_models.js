var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var should = require('should');

var conf = require('../lib/conf');
var models = require('../lib/models');

var ObjectId = mongoose.Types.ObjectId;
var Choice = models.Choice;
var User = models.User;

// Connect to the test database
mongoose.connect(conf.get('STRAWPOLL_TEST_MONGO_CONNECTION_STRING'), function(err) {
  if (err) {
    console.log(err);
  }
});

describe('models', function() {
  beforeEach(function(done) {
    // Delete all models from the database
    async.parallel([
      function(callback) {
        Choice.remove({}, function(err) {
          callback();
        });
      },
      function(callback) {
        User.remove({}, function(err) {
          callback();
        });   
      }
    ], function(err, callback) {
      done();
    });
  });

  var createTestUsers = function(callback) {
    User.create([
      {
        name: 'Geoff',
        phone: '+11234567890'
      },
      {
        name: 'TestUser1',
        phone: '+10000000000'
      }
      ], function(err) {
        callback();
      });
  };

  var createTestChoices = function(callback) {
    Choice.create([
      {
        name: 'Bad News'
      },
      {
        name: 'Bummer Town'
      },
      {
        name: 'The Hang In There Cats'
      }
    ], function(err) {
      callback();
    });
  };

  var createTestVotes = function(callback) {
    async.parallel([
      function(callback) {
        User.findOne({
          phone: '+11234567890'
        }, function(err, user) {
          Choice.findOne({
            name: 'The Hang In There Cats'
          }, function(err, choice) {
            choice.votes.push({
              userId: new ObjectId(user.id),
              value: false 
            });

            choice.save(function(err) {
              callback();
            });
          });
        });
      },
      function(callback) {
        User.findOne({
          phone: '+10000000000'
        }, function(err, user) {
          Choice.findOne({
            name: 'The Hang In There Cats'
          }, function(err, choice) {
            choice.votes.push({
              userId: new ObjectId(user.id),
              value: true 
            });

            choice.save(function(err) {
              Choice.findOne({
                name: 'Bad News',
              }, function(err, choice) {
                choice.votes.push({
                  user: user,
                  value: true
                });
                choice.save(function(err) {
                  callback();
                });
              });
            });
          });
        });
      }
    ],
    function(err, cb) {
      callback();
    });
  };

  describe('Choice', function() {
    describe('#forUser()', function() {
      beforeEach(function(done) {
        async.parallel([
          createTestUsers,
          createTestChoices
        ], function(err, callback) {
          createTestVotes(function() {
            done();
          });
        });
      });

      it('should return a choice that the user has not seen before, if available', function(done) {
        User.findOne({
          phone: '+11234567890'
        }, function(err, user) {
          Choice.forUser(user, 1, function(err, choice) {
            nameCool = _.contains(['Bad News', 'Bummer Town'], choice.name).should.be.true;
            done();    
          });
        });
      });
    });
  });
});
