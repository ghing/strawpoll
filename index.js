var mongoose = require('mongoose');
var winston = require('winston');

var app = require('./lib/app');
var conf = require('./lib/conf');

mongoose.connect(conf.get('STRAWPOLL_MONGO_CONNECTION_STRING'));

var server = app.listen(conf.get('STRAWPOLL_PORT'), function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Strawpoll listening at http://%s:%s', host, port);
  winston.stream({ start: -1 }).on('log', function(log) {
    console.log(log);
  });
});
