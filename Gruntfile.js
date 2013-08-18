module.exports = function(grunt) {

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
        configFile: 'karma.conf.js'
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
        browsers: ['sl_chorme', 'sl_firefox', 'sl_opera', 'sl_safari', 'sl_ie10', 'sl_iphone'],
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
  //Development
  grunt.registerTask("test", ["karma:travis"]);
};