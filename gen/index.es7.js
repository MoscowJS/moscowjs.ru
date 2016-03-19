import Handlebars from 'handlebars';
import fs from 'fs-promise';
import _ from 'lodash';

import getContent from './content';

async function _getTemplate(p) {
  const templateStr = await fs.readFile(p);
  return Handlebars.compile(templateStr.toString());
}


async function _registerPartial(name, path) {
  const content = await fs.readFile(path);
  Handlebars.registerPartial(name, content.toString());
}


async function _renderIndex(data) {
  console.log('xxx data', data);
  const template = await _getTemplate('templates/index.hbt.html');
  return await fs.writeFile('app/index.html', template(data));
}


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

  await _registerPartial('head', 'templates/partials/head.hbt.html');
  await _registerPartial('foot', 'templates/partials/foot.hbt.html');

  await _renderIndex(content);

  // await _renderEventPages();
  // await _renderSpeakerPages();

  // await _renderEventsPage();
  // await _renderSpeakersPage();

}

generatePages()
  .then(() => console.log('OK'))
  .catch((err) => console.error(err.stack));

