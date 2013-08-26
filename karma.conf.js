// Karma configuration
// Generated on Sat Aug 17 2013 12:12:06 GMT+0300 (FLE Daylight Time)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/sinon/pkg/sinon-1.7.3.js',
      'src/*.js',
      'test/*Spec.js'
    ],


    // list of files to exclude
    exclude: [

    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['Chrome'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,


    // define SL browsers
    customLaunchers: {
      sl_opera: {
        base: 'SauceLabs',
        browserName: "opera",
        platform: 'Windows 7',
        version: "12"
      },
      sl_iphone: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.8',
        version: '6'
      },
      sl_safari: {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.8',
        version: '6'
      },
      sl_ie10: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8',
        version: '10'
      },
      sl_chorme: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7'
      },
      sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '21'
      }
    },


    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    }
  });
};
