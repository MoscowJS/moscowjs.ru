'use strict';

// utils
var path = require('path');
var fs = require('fs');

// grunt
module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var config = require('./config.json');

  grunt.initConfig({

    cfg: config,

    // watch file changes and trigger reload in browser
    watch: {

      livereload: {
        options: {
          livereload: config.livereload_port
        },
        files: [
          '<%= cfg.frontend %>/{,views/}*.html',
          '<%= cfg.frontend %>/styles/*.css',
          '<%= cfg.frontend %>/scripts/{,*/}*.js',
          '<%= cfg.frontend %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }

    },

    // start express server
    express: {

      options: {
        // specify address to link server. example: localhost
        hostname: '*'
      },

      development: {
        options: {
          port: config.development.port,
          livereload: true,
          serverreload: true,
          server: path.resolve(__dirname, config.backend + '/development')
        }
      },

      production: {
        options: {
          port: config.production.port,
          server: path.resolve(__dirname, config.backend + '/production')
        }
      }

    },

    // open address in browser
    open: {

      server: {
        url: 'http://localhost:<%= cfg.development.port %>'
      }

    },

    // delete previous build
    clean: {

      build: {
        files: [{
          dot: true,
          src: [
            '<%= cfg.frontend_build %>/*'
          ]
        }]
      }

    },

    // add revision prefix to files
    rev: {

      build: {
        files: {
          src: [
            '<%= cfg.frontend_build %>/styles/*.css',
            '<%= cfg.frontend_build %>/scripts/{,*/}*.js',
            '<%= cfg.frontend_build %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
          ]
        }
      }

    },

    // see `usemin` task
    useminPrepare: {
      html: '<%= cfg.frontend %>/index.html',
      options: {
        root: '<%= cfg.frontend %>',
        dest: '<%= cfg.frontend_build %>'
      }
    },

    // concatination preprocessor: creates `concat`, `cssmin`, `copy` tasks,
    usemin: {
      html: ['<%= cfg.frontend_build %>/{,*/}*.html'],
      css: ['<%= cfg.frontend_build %>/styles/*.css'],
      options: {
        dirs: ['<%= cfg.frontend_build %>']
      }
    },

    // html minification (should has options)
    htmlmin: {
      build: {
        files: [{
          expand: true,
          cwd: '<%= cfg.frontend %>',
          src: ['*.html', 'views/*.html'],
          dest: '<%= cfg.frontend_build %>'
        }]
      }
    },

    // copy files to build dir
    copy: {
      development: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= cfg.frontend %>',
          dest: '<%= cfg.frontend_build %>',
          src: [
            '{,*/}*.{txt,ico}',
            'images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
          ]
        }]
      }
    },

    // angular preprocessor to prevent injecting instances from minifying
    ngmin: {
      build: {
        files: [{
          expand: true,
          cwd: '<%= cfg.frontend_build %>/scripts',
          src: '*.js',
          dest: '<%= cfg.frontend_build %>/scripts'
        }]
      }
    }

  });

  // register tasks

  grunt.registerTask('keepalive', function() {
    // it's needed to keep grunt process alive
    this.async();
  });

  grunt.registerTask('server', function(target) {
    if (target === 'production') {
      return grunt.task.run(['build', 'express:production:keepalive', 'keepalive']);
    }

    grunt.task.run([
      'express:development',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('build', [
    'clean',
    'useminPrepare',
    'concat',
    'copy',
    'htmlmin',
    'ngmin',
    'cssmin',
    'uglify',
    'rev',
    'usemin'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);

};