const { series, parallel, src, dest } = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

function concatJs(cb) {
  return src('./src/*.es6.js')
    .pipe(concat('haxademic.es6.js'))
    .pipe(dest('./bin/'));
  cb();
}

function babelJs(cb) {
  return src('./bin/*.es6.js')
    .pipe(concat('haxademic.min.js'))
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest('./bin/'))
  cb();
}

exports.build = series(concatJs, babelJs);
exports.default = exports.build;
