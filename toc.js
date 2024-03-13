const fs = require('fs');
const log = require('fancy-log');
const colors = require('ansi-colors');
const config = require('./gulp/config.js');

function getPagesList (folder) {
  let arr = [];

  fs.readdirSync(folder).forEach(file => {
    if (file !== 'global.json') {
      arr.push(file.replace(/\.[^/.]+$/, ''));
    }
  });

  return arr;
}

function createListFile (list) {
  const fileContent = JSON.stringify(list);
  const filepath = config.dest.root + '/toc.json';

  fs.writeFile(filepath, fileContent, (err) => {
    if (err) throw err;
  });
}

function createToC () {
  let navList = getPagesList(config.src.data);

  createListFile(navList);

  log(colors.green('Table of Contents was succesfully saved!'));
}

module.exports.createToC = createToC;
