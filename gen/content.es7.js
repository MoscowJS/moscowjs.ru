import fs from 'fs-promise';
import md from 'commonmark';
import mdh from 'commonmark-helpers';
import isUrl from 'is-url';

const MD_PARSER = new md.Parser();
const FILE_MASK = /\w+\.md$/;
const DATE_MASK = /(\d{1,2})\s+(\W+)\s+(\d{4})$/;
const MONTH = {
  'сентября': '09'
}

function padZero(s) {
  if (s.length === 1) {
    return '0' + s;
  }

  return s;
}


function extractSpeaker(mdSpeakerNode) {
  return {speaker: true};
}


function extractSpeakerAndTalk(walker) {
  const talk = {};
  let speaker;

  let e;

  while ((e = walker.next())) {
    let node = e.node;

    if (mdh.isLevel(node, 2)) {
      talk.title = mdh.text(node);
    }

    if (mdh.isLevel(node, 3)) {
      speaker = extractSpeaker(node);
      break;
    }
  }

  return {talk, speaker};
};


function extractEvent(walker) {
  const event = {};
  const talks = [];
  const speakers = [];

  let e;
  let isMetaFinished = false;

  while ((e = walker.next())) {
    let node = e.node;

    if (mdh.isLevel(node, 1)) {
      event.title = mdh.text(node);

      // skip text node
      walker.resumeAt(node._next, true);
    }

    if (mdh.isLevel(node, 2)) {
      isMetaFinished = true;
      let {talk, speaker} = extractSpeakerAndTalk(walker);
      talks.push(talk);
      speakers.push(speaker);

      // skip text node
      walker.resumeAt(node._next, true);
    }

    if (!isMetaFinished && mdh.isText(node)) {
      let content = mdh.text(node).trim();
      let dateMatch = content.match(DATE_MASK);

      if (dateMatch) {
        let day = padZero(dateMatch[1]);
        let monthString = dateMatch[2];
        let year = dateMatch[3];
        let monthNumber = MONTH[monthString];

        event.date = {
          iso: `${year}-${monthNumber}-${day}T23:00:00Z`,
          day,
          month: monthString,
          year
        }

        continue;
      }

      if (isUrl(content)) {
        event.registrationLink = content;
        continue;
      }
    }
  }

  console.log('event', event);
  console.log('talks', talks);
  console.log('speakers', speakers);
};

async function getContent() {
  const files = await fs.readdir('./events');
  const events = [];

  for (let eventFile of files) {
    if (!FILE_MASK.test(eventFile)) {
      continue;
    }

    let path = './events/' + eventFile;
    let mdEvent = await fs.readFile(path, 'utf8');
    let mdEventParsed = MD_PARSER.parse(mdEvent);
    let mdEventWalker = mdEventParsed.walker();
    let event = extractEvent(mdEventWalker);
  }

};


getContent().then(function() {}, function(e) {
  console.error(e);
});


export default getContent;
