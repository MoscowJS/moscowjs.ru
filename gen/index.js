'use strict';

var co = require('co'),
    fs = require('co-fs'),
    Handlebars = require('handlebars'),
    db = require('./db'),
    stream = require('stream'),
    util = require('util'),
    _ = require('lodash');


module.exports.gen_stream = gen_stream;


function * _getTemplate(p) {
  var templateStr = yield fs.readFile(p),
      template = Handlebars.compile(templateStr.toString());

  return template;
}


function * _registerPartial(name, path) {
  var content = yield fs.readFile(path);
  Handlebars.registerPartial(name, content.toString());
}


function * _renderIndex() {
  var data = yield db.index(),
      template = yield _getTemplate('templates/index.hbt.html');

  return yield fs.writeFile('app/index.html', template(data));
}


function * _renderEventPages() {
  var data = yield db.index(),
      template = yield _getTemplate('templates/event.hbt.html');

  return yield _.map(data.events, function *(event) {
    var pagePath = 'app/events/' + event.id + '.html';
    return yield fs.writeFile(pagePath, template(event));
  });
};


function * _renderEventsPage() {
  var data = yield db.events(),
      template = yield _getTemplate('templates/events.hbt.html');

  return yield fs.writeFile('app/events.html', template(data));
};


function * _renderSpeakerPages() {
  var data = yield db.speakers(),
      template = yield _getTemplate('templates/speaker.hbt.html');

  return yield _.map(data, function * (speaker) {
    var pagePath = 'app/speakers/' + speaker.id + '.html';
    return yield fs.writeFile(pagePath, template(speaker));
  });
};


function * _renderSpeakersPage() {
  var data = yield db.speakers(),
      template = yield _getTemplate('templates/speakers.hbt.html');

  return yield fs.writeFile('app/speakers.html', template({
    speakers: data
  }));
};


function gen(cb) {
  co(function *() {
    Handlebars.registerHelper('ifEq', function(v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return '';
    });

    Handlebars.registerHelper('ifNEq', function(v1, v2, options) {
      if (v1 !== v2) {
        return options.fn(this);
      }
      return '';
    });

    yield _registerPartial('head', 'templates/partials/head.hbt.html');
    yield _registerPartial('foot', 'templates/partials/foot.hbt.html');

    yield _renderIndex();

    yield _renderEventPages();
    yield _renderSpeakerPages();

    yield _renderEventsPage();
    yield _renderSpeakersPage();
  })(cb);
}

/**
 * Represents gen process as a stream.
 */
function gen_stream() {
  /**
   * Readable stream, that represents gen process.
   */
  function GenStream() {
    stream.Readable.call(this);
  }

  util.inherits(GenStream, stream.Readable);

  GenStream.prototype._read = function () {
    var genStream = this;
    gen(function (err) {
      if (err) {
        throw err;
      }
      genStream.push(null);
    });
  };

  return new GenStream();

}
