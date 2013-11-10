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

    open: {

      server: {
        url: 'http://localhost:<%= cfg.development.port %>'
      }

    },

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

    useminPrepare: {
      html: '<%= cfg.frontend %>/index.html',
      options: {
        root: '<%= cfg.frontend %>',
        dest: '<%= cfg.frontend_build %>'
      }
    },

    usemin: {
      html: ['<%= cfg.frontend_build %>/{,*/}*.html'],
      css: ['<%= cfg.frontend_build %>/styles/*.css'],
      options: {
        dirs: ['<%= cfg.frontend_build %>']
      }
    },

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

    cdnify: {
      build: {
        html: '<%= cfg.frontend_build %>/index.html'
      }
    },

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
    'cdnify',
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