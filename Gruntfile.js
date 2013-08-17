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
        browsers: ['Firefox']
      }
    }
  });

  // Packages
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');

  // Tasks.
  grunt.registerTask('min', ['uglify']);

  grunt.registerTask('test', 'Run tests on singleRun karma server', function() {
    //this task can be executed in 2 different environments: local and Travis-CI
    //we need to take settings for each one into account
    if (process.env.TRAVIS) {
      grunt.task.run('karma:travis');
    } else {
      grunt.task.run('karma:continuous');
    }
  });
};