var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();
var mongoose = require('mongoose');
var conf = require('./conf');
var handlers = require('./handlers');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
})); 
app.use(cookieParser());

app.post('/sms', handlers.handleSMS);

module.exports = app;
