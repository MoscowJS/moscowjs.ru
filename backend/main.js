var express = require('express');
var path = require('path');
var fs = require('fs');

var app = express();

var config = require(path.resolve('config.json'));

var indexFile, rootPath;

module.exports = function(mode) {

  if (mode === 'production') {
    rootPath = path.resolve(config.frontend_build);
  } else {
    rootPath = path.resolve(config.frontend);
  }

  indexFile = fs.readFileSync(path.resolve(rootPath, 'index.html'));

  app.use(express.logger('dev'));

  // marker for `grunt-express` to inject static folder/contents
  app.use(function staticsPlaceholder(req, res, next) {
    return next();
  });

  app.use(require('connect-livereload')({ port: config.livereload_port }));
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'moscow javascript secret' }));
  app.use(express.bodyParser());
  app.use(express.static(rootPath));
  app.use(app.router);

  app.get('/api/*', function(req, res) {
    return res.json({ok: false});
  });

  app.get('/*', function(req, res) {
    res.header('Content-Type', 'text/html');
    return res.send(indexFile);
  });

  return app;

};