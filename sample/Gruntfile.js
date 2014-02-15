module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';',
        stripBanners: true
      }
    },
    uglify: {
      options: {
        // DON'T PUT ANY DYNAMICAL CONTENT IN 'banner' LIKE <%= grunt.template.today("yyyy-mm-dd") %>, OTHERWISE THE 'rev' TASK COULD GENERATE FILENAMES BASED ON DYNAMIC CONTENT EACH TIME YOU RUN IT.
        banner: '/*! <%= pkg.name %> */\n',
        report: 'min'
      }
    },
    cssmin: {
      options: {
          keepSpecialComments: 0,
          // DON'T PUT ANY DYNAMICAL CONTENT IN 'banner' LIKE <%= grunt.template.today("yyyy-mm-dd") %>, OTHERWISE THE 'rev' TASK COULD GENERATE FILENAMES BASED ON DYNAMIC CONTENT EACH TIME YOU RUN IT.
          banner: '/*! <%= pkg.name %> */\n',
          report: 'min'
      }
    },
    rev: {
        options: {
          encoding: 'utf8',
          algorithm: 'md5',
          length: 8
        }
    },
    applymin: {
        options: {
            // The regular expression to match and fetch the css/js resources between beginmin and endmin in your html templates.
            staticPattern: /(static\/.*?\.(css|js))/i,
        },
        // The 'beginmin: srcFiles' contains all your html templates, for example: *.jsp/*.php/*.mako/*.tpl
        beginmin: 'views/**/*.tpl',
        // The 'endmin: destPath' will store all the minified css/js files
        // In your html template, the target filepath in 'beginmin' comments should start with this name.
        endmin: 'static/assets'
    },
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-applymin');

  // Default task(s).
  grunt.registerTask('default', ['applymin:beginmin', 'concat', 'uglify', 'cssmin', 'rev', 'applymin:endmin']);
};

