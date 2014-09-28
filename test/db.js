'use strict';
var codb = require('co-db'),
    fs = require('fs-extra'),
    co = require('co'),
    assert = require('assert'),
    proxyquire = require('proxyquire');


describe('db', function () {
  var db;

  beforeEach(function () {
    var mockCoDb = function *() {
      return yield codb('test/content');
    }

    db = proxyquire('../db', {'co-db': mockCoDb});

    fs.mkdirp('test/content/events');
    fs.mkdirp('test/content/speakers');
    fs.mkdirp('test/content/talks');
  });

  afterEach(function () {
    fs.removeSync('test/content');
  });

  describe('.index()', function () {

    it('contains all events in folder', function (done) {
      fs.createFileSync('test/content/events/event1');
      fs.createFileSync('test/content/events/event2');
      fs.createFileSync('test/content/events/event3');

      co(function *() {
        var data = yield db.index();

        assert.ok(data.events);
        assert.equal(3, data.events.length);
        assert.equal('event1', data.events[0].id);
        assert.equal('event2', data.events[1].id);
        assert.equal('event3', data.events[2].id);
      })(done);
    });


    it('contains data about talks', function (done) {
      fs.createFileSync('test/content/events/event1');
      fs.createFileSync('test/content/talks/talk1');
      fs.createFileSync('test/content/talks/talk2');

      var talkData = (
        '---\n' +
        'title: Talk title\n' +
        'event: event1\n' +
        '---\n'
      );

      fs.writeFileSync('test/content/talks/talk1', talkData);
      fs.writeFileSync('test/content/talks/talk2', talkData);

      co(function *() {
        var data = yield db.index(),
            ev = data.events[0],
            i;

        assert.equal(2, ev.talks.length);
        ev.talks.forEach(function (talk) {
          assert.equal('Talk title', talk.title);
        });
      })(done);
    });


    it('contains data about speakers', function (done) {
      var talkData = (
        '---\n' +
        'speaker: speaker1\n' +
        'event: event1\n' +
        '---\n'
      );

      var speakerData = (
        '---\n' +
        'name: Speaker Ivanovich\n' +
        '---\n'
      );

      fs.createFileSync('test/content/events/event1');
      fs.createFileSync('test/content/talks/talk1');
      fs.createFileSync('test/content/speakers/speaker1');


      fs.writeFileSync('test/content/talks/talk1', talkData);
      fs.writeFileSync('test/content/speakers/speaker1', speakerData);

      co(function *() {
        var data = yield db.index(),
            event = data.events[0],
            talk = event.talks[0],
            speaker = talk.speaker;

        assert.equal('Speaker Ivanovich', speaker.name);
      })(done);
    });


    it('sets registrationOpened: false, after deadline', function (done) {
      var eventData = (
        '---\n' +
        'deadline: 1999-01-01\n' +
        '---\n'
      );

      fs.createFileSync('test/content/events/event1');
      fs.writeFileSync('test/content/events/event1', eventData);

      co(function* () {
        var data = yield db.index(),
            event = data.events[0];

        assert.equal(event.registrationOpened, false);
      })(done);
    });


    it('sets registrationOpened: true, before deadline', function (done) {
      var eventData = (
        '---\n' +
        'deadline: 2999-01-01\n' +
        '---\n'
      );

      fs.createFileSync('test/content/events/event1');
      fs.writeFileSync('test/content/events/event1', eventData);

      co(function* () {
        var data = yield db.index(),
            event = data.events[0];

        assert.equal(event.registrationOpened, true);
      })(done);
    });

  });

});
