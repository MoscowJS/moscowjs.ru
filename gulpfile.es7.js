'use strict';
// generated on 2014-09-08 using generator-gulp-webapp 0.1.0

var gulp = require('gulp'),
    gen = require('./gen');

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
    return gulp.src('app/styles/main.scss')
        .pipe($.compass({
          import_path: ['app/bower_components', 'app/styles'],
          sass: 'app/styles',
          css: '.tmp/styles'
        }))
        .pipe($.autoprefixer('last 3 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size());
});

gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});


gulp.task('gen', function () {
  return gen();
});

gulp.task('html', ['gen', 'styles', 'scripts'], function() {
  var jsFilter = $.filter('**/*.js'),
      cssFilter = $.filter('**/*.css'),
      assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('.tmp/**/*.html')
    .pipe(assets)
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});


gulp.task('imageresize', function () {
    return gulp.src([
      'images/**/*.jpg',
      'images/**/*.jpeg',
      'images/**/*.png'
    ])
      .pipe($.imageResize({
        width : 160,
        height : 160,
        crop : true,
        upscale : false
      }))
      .pipe(gulp.dest('images'))
});

gulp.task('imagemin', ['imageresize'], function () {
    return gulp.src([
      'images/**/*.jpg',
      'images/**/*.jpeg',
      'images/**/*.png',
      'images/**/*.svg',
      'images/**/*.webp'
    ])
      .pipe($.cache($.imagemin({
          optimizationLevel: 3,
          progressive: true,
          interlaced: true
      })))
      .pipe(gulp.dest('images'))
      .pipe($.size());
});

gulp.task('images', function () {
    return gulp.src([
      'images/**/*.jpg',
      'images/**/*.jpeg',
      'images/**/*.png',
      'images/**/*.svg',
      'images/**/*.webp'
    ])
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});


gulp.task('extras', function () {
    return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', ['html', 'images', 'extras']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('connect', ['gen'], function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('.tmp'))
        .use('/images', connect.static('images'));

    require('http').createServer(app)
        .listen(8888)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:8888');
        });
});

gulp.task('serve', ['gen', 'connect', 'styles'], function () {
    require('opn')('http://localhost:8888');
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('.tmp/**/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components',
            exclude: ['bootstrap-sass-official']
        }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('watch', ['gen', 'connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes

    gulp.watch([
        '.tmp/**/*.html',
        '.tmp/styles/**/*.css',
        'app/scripts/**/*.js',
        'images/**/*',
    ]).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('images/**/*', ['images']);
    gulp.watch([
      'content/**/*',
      'templates/**/*'
    ], ['gen'])
    gulp.watch('bower.json', ['wiredep']);
});

