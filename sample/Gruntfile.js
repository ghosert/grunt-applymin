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
            // They regular expression to match and fetch the css/js resource in your html templates.
            staticPattern: /(static\/.*?\.(css|js))/i,
        },
        // The 'beginmin: srcFiles' contains all your html templates.
        beginmin: 'views/**/*.tpl',
        // The 'endmin: destPath' will store all the produced css/js files
        // You should start with this name for your targetFilePath which defined in your html template.
        endmin: 'static/assets'
    },
    clean: {
        all: ['static/assets/**/*']
    },
  });


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-applymin');

  // Default task(s).
  grunt.registerTask('default', ['clean:all', 'applymin:beginmin', 'concat', 'uglify', 'cssmin', 'rev', 'applymin:endmin']);
};

