/*
install grunt:
npm install -g grunt-cli

then in project dir:
npm init
npm i grunt --save-dev
npm i grunt-babel babel-preset-es2015 --save-dev
*/

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    babel: {
        options: {
            sourceMap: false,
            presets: ['es2015'],
            minified: false,
            compact: false
        },
        dist: {
            files: [{
                expand: true,
                cwd: 'src',
                src: ['**/*.es6.js'],
                dest: 'dist',
                ext: '.js'
            }]

        }
    }
   }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-babel');

  // Default task(s).
  grunt.registerTask('default', ['babel']);
};
