var express = require('express');
var mongoose = require('mongoose');
var request = require('supertest');
var should = require('should');
var sinon = require('sinon');

var app = require('../lib/app');
var conf = require('../lib/conf');
var models = require('../lib/models');

// Connect to the test database
mongoose.connect(conf.get('STRAWPOLL_TEST_MONGO_CONNECTION_STRING'), function(err) {});


describe('handlers', function() {
  describe('#handleSMS()', function() {
    var postData = {
      ToCountry: 'US',
      ToState: 'IN',
      SmsMessageSid: 'SM45f214c6a55776eea300034be5b1357f',
      NumMedia: '0',
      ToCity: 'ROSSVILLE',
      FromZip: '60606',
      SmsSid: 'SM45f214c6a55776eea300034be5b1357f',
      FromState: 'IL',
      SmsStatus: 'received',
      FromCity: 'CHICAGO',
      Body: 'Geoff',
      FromCountry: 'US',
      To: '+17653796263',
      ToZip: '46058',
      MessageSid: 'SM45f214c6a55776eea300034be5b1357f',
      AccountSid: 'AC657a8a859207cac66c1d9ad8e411d867',
      From: '+17731234567',
      ApiVersion: '2010-04-01' 
    };
    var agent = request.agent(app);

    it('should add a choice when not a reply', function(done) {
      // Mock database interactions 
      var createChoiceStub = sinon.stub(models, 'createChoice', function(name, callback) {
        var choice = new models.Choice({ name: name });
        callback(null, choice); 
      });
      var findOneStub = sinon.stub(models.User, 'findOne', function(search, cb) {
        var user = new models.User({ name: 'Geoff', phone: postData.From });
        cb(null, user);
      });

      request(app)
        .post('/sms')
        .send(postData)
        .end(function(error, res) {
          createChoiceStub.calledWith(postData.Body).should.equal(true);
          done();
        });
    });
  }); 
});
