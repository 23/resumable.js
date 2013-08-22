module.exports = function(grunt) {
  var browsers = grunt.option('browsers') && grunt.option('browsers').split(',') || ['Chrome'];
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n'
      },
      build: {
        src: 'src/resumable.js',
        dest: 'build/resumable.min.js'
      }
    },
    watch: {},
    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: browsers
      },
      watch: {
        autoWatch: true,
        background: false
      },
      continuous: {
        singleRun: true
      },
      travis: {
        singleRun: true,
        // Two buggiest browsers
//        browsers: ['sl_opera', 'sl_ie10'],
        // global config for SauceLabs
        sauceLabs: {
          username: process.env.SAUCE_USERNAME,
          accessKey: process.env.SAUCE_ACCESS_KEY,
          startConnect: true,
          testName: 'Resumable.js'
        }
      }
    }
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON("package.json").devDependencies) {
    if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
  }

  // Default task.
  grunt.registerTask('default', ['test']);
  // Release tasks
  grunt.registerTask('min', ['uglify']);
  // Development
  grunt.registerTask('test', 'Run tests on travis.', function() {
    var list = ['sl_opera', 'sl_ie10', 'sl_safari', 'sl_chorme', 'sl_firefox'];
    list.forEach(function (browser) {
      var config = grunt.config('karma.travis');
      config.browsers = [browser];
      grunt.config('karma.travis', config);
      grunt.task.run(["karma:travis"]);
    });
  });
};