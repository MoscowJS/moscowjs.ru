import fs from 'fs-promise';
import md from 'commonmark';
import mdh from 'commonmark-helpers';
import isUrl from 'is-url';

import Translit from 'translit';
import translitRussian from 'translit-russian';

const translit = Translit(translitRussian);

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
  const nameAndJob = mdh.text(mdSpeakerNode);
  const [name, job] = nameAndJob.split(/\s*\,\s*/g);
  const names = name.split(/\s+/g);
  const firstName = names[0];
  const lastName = names.slice(1).join(' ');
  const id = translit(names.join(''));
  const nextNode = mdSpeakerNode.next;
  let pic;

  if (nextNode && mdh.isImage(nextNode.firstChild)) {
    pic = nextNode.firstChild.destination;
  }

  return {
    id,
    firstName,
    lastName,
    pic,
    job
  };
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
    const node = e.node;

    if (mdh.isLevel(node, 1)) {
      event.title = mdh.text(node);

      // skip text node
      walker.resumeAt(node._next, true);
    }

    if (mdh.isLevel(node, 2)) {
      isMetaFinished = true;
      const {talk, speaker} = extractSpeakerAndTalk(walker);
      talk.speaker = speaker;
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

  event.talks = talks;

  return {
    event,
    speakers
  };
};

async function getContent() {
  const files = await fs.readdir('./events');
  const allEvents = [];
  let allSpeakers = [];

  for (let eventFile of files) {
    if (!FILE_MASK.test(eventFile)) {
      continue;
    }

    let path = './events/' + eventFile;
    let mdEvent = await fs.readFile(path, 'utf8');
    let mdEventParsed = MD_PARSER.parse(mdEvent);
    let mdEventWalker = mdEventParsed.walker();
    let {event, talks, speakers} = extractEvent(mdEventWalker);

    event.id = eventFile.replace(/\..+$/g, '');

    allEvents.push(event);
    allSpeakers = allSpeakers.concat(speakers);
  }

  return {
    events: allEvents,
    speakers: allSpeakers
  }
};


export default getContent;