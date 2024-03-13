#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const config = require('./gulp/config.js');

const args = process.argv.slice(2);
let title;
let category;

if (args && args[0]) {
  title = args[0];
} else {
  title = 'newcomp';
}

if (args && args[1]) {
  category = args[1];
} else {
  category = 'unsorted';
}

newComponent(title, category);

function newComponent (name, category) {
  const paths = {
    src: path.join(config.src.components, category, name),
    dest: path.join('components', category, name)
  };

  ensureDirectoryExists(paths.src + '/index.html');

  createHTML(name, paths.src, paths.dest);
  createStylesheet(name, paths.src);
  createScript(name, paths.src);

  console.log('Component ' + name + ' was succesfully created');
}

function createHTML (name, cat, dest) {
  const stream = fs.createWriteStream(cat + '/' + name + '.njk');

  stream.once('open', (fd) => {
    stream.write('<link rel="stylesheet" href="' + dest + '/' + name + '.css" />\n');
    stream.write('<script src="' + dest + '/' + name + '.js"></script>\n\n');

    stream.end();
  });
}

function createStylesheet (name, cat) {
  const stream = fs.createWriteStream(cat + '/' + name + '.scss');

  stream.once('open', (fd) => {
    stream.write('@use "sass:math";\n\n');
    stream.write('@import "dev/scss/helpers/variables";\n');
    stream.write('@import "dev/scss/helpers/mixins";\n\n');

    stream.end();
  });
}

function createScript (name, cat) {
  const filepath = cat + '/' + name + '.js';

  fs.writeFile(filepath, '', (err) => {
    if (err) throw err;
  });
}

function ensureDirectoryExists (filePath) {
  const dirname = path.dirname(filePath);

  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}
