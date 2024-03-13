'use strict';

const gulp = require('gulp');
const server = require('browser-sync').create();
const argv = require('minimist')(process.argv.slice(2));
const config = require('../config');

// in CL 'gulp server --open' to open current project in browser
// in CL 'gulp server --tunnel siteName' to make project available over http://siteName.localtunnel.me

gulp.task('server', function () {
  server.init({
    server: {
      baseDir: !config.production ? [config.dest.root, config.src.root] : config.dest.root,
      directory: false,
      serveStaticOptions: {
        extensions: ['html']
      },
      middleware: function (req, res, next) {
        // корректная обработка POST-запросов
        if (/\.json|\.txt|\.html|\.php/.test(req.url) && req.method.toUpperCase() === 'POST') {
          req.method = 'GET';
        }
        next();
      }
    },
    files: [
      config.dest.html + '/*.html',
      config.dest.css + '/*.css',
      config.dest.html + '/*.css',
      config.dest.js + '/**/*.js',
      config.dest.images + '/**/*.{' + config.ext.images + '}',
      config.dest.components + '/**/*.{ html|css|js|' + config.ext.images + '}'
    ],
    port: argv.port || 3000,
    logLevel: 'info', // 'debug', 'info', 'silent', 'warn'
    logConnections: false,
    logFileChanges: true,
    open: Boolean(argv.open),
    notify: false,
    ghostMode: false,
    online: Boolean(argv.tunnel),
    tunnel: argv.tunnel || null
  });
});

module.exports = server;
