module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
        // to be removed all: [beginmin.assetsPath + '/**/*'] // 'assets/*'
        all: []
    },
    concat: {
      options: {
        separator: ';',
        stripBanners: true
      },
      dist: {
        // to be removed files: beginmin.concatFiles
      }
    },
    uglify: {
      options: {
        // DON'T PUT ANY DYNAMICAL CONTENT IN 'banner' LIKE <%= grunt.template.today("yyyy-mm-dd") %>, OTHERWISE THE 'rev' TASK COULD GENERATE FILENAMES BASED ON DYNAMIC CONTENT EACH TIME YOU RUN IT.
        banner: '/*! <%= pkg.name %> */\n',
        report: 'min'
      },
      dist: {
        // to be removed files: beginmin.uglifyFiles
      }
    },
    cssmin: {
      options: {
          keepSpecialComments: 0,
          // DON'T PUT ANY DYNAMICAL CONTENT IN 'banner' LIKE <%= grunt.template.today("yyyy-mm-dd") %>, OTHERWISE THE 'rev' TASK COULD GENERATE FILENAMES BASED ON DYNAMIC CONTENT EACH TIME YOU RUN IT.
          banner: '/*! <%= pkg.name %> */\n',
          report: 'min'
      },
      dist: {
        // to be removed files: beginmin.cssminFiles
      }
    },
    rev: {
        options: {
          encoding: 'utf8',
          algorithm: 'md5',
          length: 8
        },
        files: {
            src: [
              // to be removed beginmin.assetsPath + '/**/*'
            ] // means 'assets/**/*'
        }
    },
    applymin: {
        beginmin: {
            files: {
              // the destPath will store all the produced css/js files, you should start with this name for your targetFilePath which defined in your html template.
              'sample/static/assets': ['sample/views/**/*.tpl'],
            },
        },
        endmin: {
        // Placeholder target to be run later.
        }
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

