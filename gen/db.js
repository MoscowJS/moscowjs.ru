'use strict';

var co = require('co'),
    codb = require('co-db'),
    frontMatter = require('yaml-front-matter'),
    _ = require('lodash'),
    marked = require('marked'),
    _dbObj,
    _db;



module.exports.events = function* () {
  var db = yield _db(),
      events = yield db.docs('events'),
      talks = yield db.docs('talks');


  events = yield _.map(events, _attachTalks(talks).toEvent);

  _.forEach(events, function (event) {
    var now = new Date();

    event.date = event.date || {};

    if (event.date.iso) {
      event.date.date = new Date(Date.parse(event.date.iso));
    }

    if (event.deadline) {
      event.deadline = new Date(Date.parse(event.deadline));
    }

    if (!event.deadline) {
      event.deadline = event.date.date;
    }

    event.registrationOpened = now < event.deadline;

    if (now < event.deadline) {
      event.status = 'registration';
      event.upcomingOrPast = 'upcoming';
    }

    if (now > event.deadline && now < event.date.date) {
      event.status = 'closed';
      event.upcomingOrPast = 'upcoming';
    }

    if (now > event.date.date) {
      event.status = 'past';
      event.upcomingOrPast = 'past';
    }
  });

  events = _.sortBy(events, function (event) {
    if (event.date.iso) {
      return -Date.parse(event.date.iso);
    }
    return 1000;
  });

  return {
    events: events
  };
};


module.exports.index = function * () {
  var eventsData = yield module.exports.events;
  eventsData.events = eventsData.events.slice(0, 2);
  return eventsData;
};


module.exports.speakers = function* () {
  var db = yield _db(),
      speakers = yield db.docs('speakers'),
      talks = yield db.docs('talks'),
      talksBySpeaker;

  talks = yield _.map(talks, function *(talk) {
    talk.event = yield db.doc('events/' + talk.event);
    return talk;
  });

  talksBySpeaker = _.groupBy(talks, function (talk) {
    return talk.speaker;
  });

  speakers = _.map(speakers, function (speaker) {
    speaker.talks = talksBySpeaker[speaker.id];
    return speaker;
  });

  return _.sortBy(speakers, 'lastName');
};


function _attachTalks(talks) {
  var closure = {};

  closure.toEvent = function* attachTalksToEvent(ev) {
    var db = yield _db();
    ev.talks = _.filter(talks, function (talk) {
      return talk.event === ev.id;
    });

    ev.talks = yield _.map(ev.talks, function *(talk) {
      if (talk.speaker) {
        talk.speaker = yield db.doc('speakers/' + talk.speaker);
      }
      return talk;
    });

    return ev;
  }

  return closure;
}


/**
 * Factory for db instance.
 */
_db = function* _db() {

  var db = yield codb('content');

  if (_dbObj) {
    return _dbObj;
  }

  db.use(function* readDoc(doc) {
    var contents = new Buffer(0),
        chunk;

    while (chunk = yield doc.contents) {
      contents = Buffer.concat([contents, chunk]);
    }

    doc.contents = contents.toString('utf8');
  });

  db.use(function* parseFrontMatter(doc) {
    var parsed = null;

    try {
      parsed = frontMatter.loadFront(doc.contents);
    } catch (e) {
      console.error('Can\'t parse', doc.path);
      console.error(e.message);
      process.exit(1);
    }

    _.extend(doc, parsed);
    doc.contents = parsed.__content;
  });

  _dbObj = db;

  db.use(function* parseMDContent(doc) {
    doc.contents = marked(doc.contents);
  });

  return db;
}
