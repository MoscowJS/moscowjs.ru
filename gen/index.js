import Handlebars from 'handlebars';
import fs from 'fs-promise';
import _ from 'lodash';

import getContent from './content';

async function _mbMkDir(dir) {
  return fs.mkdir(dir)
    .catch(() => 0);
}

async function _getTemplate(p) {
  const templateStr = await fs.readFile(p);
  return Handlebars.compile(templateStr.toString());
}


async function _registerPartial(name, path) {
  const content = await fs.readFile(path);
  Handlebars.registerPartial(name, content.toString());
}


async function _renderIndex(data) {
  data = {...data, events: data.events.slice(0, 2)};
  const template = await _getTemplate('templates/index.hbt.html');
  return fs.writeFile('.tmp/index.html', template(data));
}


async function _renderEventPages(data) {
  const template = await _getTemplate('templates/event.hbt.html');
  await _mbMkDir('.tmp/events');

  return Promise.all(_.map(data.events, function(event) {
    const pagePath = '.tmp/events/' + event.id + '.html';
    return fs.writeFile(pagePath, template(event));
  }));
}


async function _renderEventsPage(data) {
  const template = await _getTemplate('templates/events.hbt.html');
  return fs.writeFile('.tmp/events.html', template(data));
}


async function _renderSpeakerPages({speakers}) {
  const template = await _getTemplate('templates/speaker.hbt.html');
  await _mbMkDir('.tmp/speakers');

  return Promise.all(_.map(speakers, (speaker) => {
    const pagePath = `.tmp/speakers/${speaker.id}.html`;
    return fs.writeFile(pagePath, template(speaker));
  }));
};


async function _renderSpeakersPage({speakers}) {
  const template = await _getTemplate('templates/speakers.hbt.html');
  return fs.writeFile('.tmp/speakers.html', template({speakers}));
};


async function generatePages() {
  const content = await getContent();

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

  await Promise.all([
    _registerPartial('head', 'templates/partials/head.hbt.html'),
    _registerPartial('foot', 'templates/partials/foot.hbt.html')
  ]);

  await _mbMkDir('.tmp');

  await Promise.all([
    _renderIndex(content),
    _renderEventPages(content),
    _renderSpeakerPages(content),
    _renderEventsPage(content),
    _renderSpeakersPage(content)
  ]);
}

export default generatePages;
