var moment = require('moment');
var should = require('should');

var models = require('../lib/models');
var Sender = require('../lib/send').Sender; 
var User = models.User;

describe('Sender', function() {
  describe('shouldSend()', function() {
    var sender = new Sender({
      wait: moment.duration(4, 'hours')
    });  

    it('should return true if the user has never been sent a choice', function() {
      var user = new User({
        name: 'Geoff'
      });
      sender.shouldSend(user).should.be.true;
    });

    it('should return true if the user has been sent a choice longer ago than the wait period', function() {
      var longAgo = moment().subtract(6, 'hours').toDate();
      var user = new User({
        name: 'Geoff',
        lastSent: longAgo
      });
      sender.shouldSend(user).should.be.true;
    });

    it('should return false if the user has been sent a choice before the wait period has expired', function() {
      var before = moment().subtract(2, 'hours').toDate();
      var user = new User({
        name: 'Geoff',
        lastSent: before 
      });
      sender.shouldSend(user).should.be.false;
    });
  });
});
