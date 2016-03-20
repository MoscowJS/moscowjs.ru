import fs from 'fs-promise';
import md from 'commonmark';
import mdh from 'commonmark-helpers';
import isUrl from 'is-url';
import _ from 'lodash';

import Translit from 'translit';
import translitRussian from 'translit-russian';

const translit = Translit(translitRussian);

const MD_PARSER = new md.Parser();
const FILE_MASK = /\w+\.md$/;
const PUNCT_MASK = /[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g;
const DATE_MASK = /(\d{1,2})\s+(\W+)\s+(\d{4})$/;
const MONTH = {
  'янв':  '01',
  'февр': '02',
  'март': '03',
  'апр':  '04',
  'май':  '05',
  'июнь': '06',
  'июль': '07',
  'авг':  '08',
  'сент': '09',
  'окт':  '10',
  'нояб': '11',
  'дек':  '12'
}


const Parts = {
  start: 'start',
  eventName: 'eventName',
  eventMeta: 'eventMeta',
  eventData: 'eventData',
  talkName: 'talkName',
  talkData: 'talkData',
  speakerName: 'speakerName',
  speakerData: 'speakerData'
};

function padZero(s) {
  if (s.length === 1) {
    return '0' + s;
  }

  return s;
}


function isDateNode(node) {
  const content = mdh.text(node).trim();
  return DATE_MASK.test(content);
}


function isUrlNode(node) {
  const content = mdh.text(node).trim();
  return isUrl(content)
}

function isImageNode(node) {
  const hasOneChild = node.firstChild === node.lastChild;
  const singleChildIsAnImage = (
    hasOneChild &&
    mdh.isImage(node.firstChild)
  );

  return mdh.isImage(node) || singleChildIsAnImage;
}


function extractTextFrom(node, currentPart, event) {
  if (currentPart === Parts.eventName) {
    event.title = mdh.html(node);
    return Parts.eventMeta;
  }


  if (currentPart === Parts.talkName) {
    let talk = {};
    talk.title = mdh.text(node);
    event.talks = event.talks || [];
    event.talks.push(talk)
    talk.id = event.talks.length;
    return Parts.talkData;
  }

  if (currentPart === Parts.speakerName) {
    const nameAndJob = mdh.text(node);
    const [name, job] = nameAndJob.split(/\s*\,\s*/g);
    const names = name.split(/\s+/g);
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');
    const id = translit(names.join('').replace(PUNCT_MASK, ''));

    const speaker = {
      firstName,
      lastName,
      id,
      job
    };


    _.last(event.talks).speaker = speaker;
    event.speakers = event.speakers || [];
    event.speakers.push(speaker);

    return Parts.speakerData;
  }

  if (currentPart === Parts.eventMeta) {
    const content = mdh.text(node).trim();

    if (isDateNode(node)) {
      const dateMatch = content.match(DATE_MASK);
      const day = padZero(dateMatch[1]);
      const monthString = dateMatch[2];
      const year = dateMatch[3];
      const monthNumber = MONTH[monthString];

      event.date = {
        iso: `${year}-${monthNumber}-${day}T23:00:00Z`,
        day,
        month: monthString,
        year
      }
      return Parts.eventMeta;
    }

    if (isUrlNode(node)) {
      event.registrationLink = content;
      return Parts.eventMeta;
    }
  }

  return currentPart;
}


function extractContentsFrom(node, currentPart, event) {
  if (currentPart === Parts.eventData) {
    event.contents = event.contents || '';
    event.contents += mdh.html(node);
    return;
  }

  if (currentPart === Parts.talkData) {
    const talk = _.last(event.talks);
    talk.contents = talk.contents || '';
    talk.contents += mdh.html(node);
    return;
  }

  if (currentPart === Parts.speakerData && !isImageNode(node)) {
    const speaker = _.last(event.speakers);
    speaker.contents = speaker.contents || '';
    speaker.contents += mdh.html(node);
    return;
  }

  if (currentPart === Parts.speakerData && isImageNode(node)) {
    const speaker = _.last(event.speakers);
    speaker.pic = node.firstChild.destination;
    return;
  }
}

function extractEvent(walker) {
  const event = {};
  const talks = [];
  const speakers = [];
  let isFirstParagraph = true;

  let e;
  let currentPart = Parts.start;

  while ((e = walker.next())) {
    if (!e.entering) continue;

    const node = e.node;

    if (mdh.isLevel(node, 1)) {
      currentPart = Parts.eventName;
      continue;
    }

    if (mdh.isLevel(node, 2)) {
      currentPart = Parts.talkName;
      continue;
    }

    if (mdh.isLevel(node, 3)) {
      currentPart = Parts.speakerName;
      continue;
    }

    if (mdh.isText(node)) {
      currentPart = extractTextFrom(node, currentPart, event);
      continue;
    }

    if (mdh.isParagraph(node) && isFirstParagraph) {
      isFirstParagraph = false;
      continue;
    }

    const isEventMeta = currentPart === Parts.eventMeta;

    // if we're in meta and it's a new paragraph -> we're done with meta
    if (mdh.isParagraph(node) && !isFirstParagraph && isEventMeta) {
      currentPart = Parts.eventData;
      extractContentsFrom(node, currentPart, event);
      continue;
    }


    if (mdh.isParagraph(node) && !isEventMeta) {
      extractContentsFrom(node, currentPart, event);
      continue;
    }
  }

  return {
    event,
    speakers: event.speakers
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
