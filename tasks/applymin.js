/*
 * grunt-applymin
 * https://github.com/ghosert/grunt-applymin
 *
 * Copyright (c) 2013 ghosert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var fs = require('fs');

  var applyminGlobal = {
      concatFiles: {},
      cssminFiles: {},
      uglifyFiles: {},
      revFiles: [],
      beginminInfos: {}, // store all the html template names as the key, and the {targetFilePath:{targetUrlPath, beginEndMinBlock}} as the values.
      // self defined staticPattern
      staticPattern: null,
      // case insensitive for html tags.
      cssPattern: /<link[\s\S]+?href\s*=\s*['"][\s\S]+?\.css[\s\S]+?>/gi,
      jsPattern: /<script[\s\S]+?src\s*=\s*['"][\s\S]+?\.js[\s\S]+?>/gi,
      beginminPattern_global: /<!--\s*beginmin:\s*(\S+)\s*-->([\s\S]*?)<!--\s*endmin\s*-->/g,
      beginminPattern: /<!--\s*beginmin:\s*(\S+)\s*-->([\s\S]*?)<!--\s*endmin\s*-->/
  };


  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

    // Put all the css or js files in one static block to the coressponding files object.
    var _fillUpGruntFilesWithPattern = function (abspath, targetFilePath, pattern, files, staticBlock) {
        if (targetFilePath in files) {
            grunt.warn('In the file: ' + abspath + ', the target filename: ' + targetFilePath + ' has already defined in this or other html template file.');
        }
        var results = staticBlock.match(pattern);
        if (results) {
            files[targetFilePath] = [];
            for (var index in results) {
                // results[index] could be like below, use staticPattern to fetch real static filepath further.
                // <link href="${request.static_url('zuoyeproject:static/css/bootstrap.css')}" rel="stylesheet" media="screen">
                // <script src="${request.static_url('zuoyeproject:static/editor/common.js')}">
                var result = results[index].match(applyminGlobal.staticPattern);
                if (result === null || result.length < 2) {
                    grunt.warn('Please check whether your "options.staticPattern": ' + applyminGlobal.staticPattern + '\n\ncould be used to fetch the static resource:\n\n' + results[index] + '\n\nin the file ' + '"' + abspath + '"');
                }
                if (!grunt.file.exists(result[1])) {
                    grunt.warn('This file does not exist: "' + result[1] + '"');
                }
                files[targetFilePath].push(result[1]);
            }
        }
    };

  /**
   * abspath: the single template file path like 'views/home.tpl'
   * targetFilePath: the result file paths within the template file like <!-- beginmin: static/assets/main.lib.min.css -->
   * staticBlock: The static block between <!-- beginmin --> xxx <!-- endmin -->
   *
   * Collect the css/js filepath from template files and fill up the dist/files in concat/cssmin
   */
  var _handleStaticBlock = function (abspath, targetFilePath, staticBlock) {

    // determine the css or js type.
    var files = null;
    var pattern = null;

    if (targetFilePath.match(/\.css$/i)) {
        pattern = applyminGlobal.cssPattern;
        files = applyminGlobal.cssminFiles;
    } else if (targetFilePath.match(/\.js$/i)) {
        pattern = applyminGlobal.jsPattern;
        files = applyminGlobal.concatFiles;
        // One more step for the js file: The js file will be uglified further.
        applyminGlobal.uglifyFiles[targetFilePath] = targetFilePath;
    }
    applyminGlobal.revFiles.push(targetFilePath);

    // handle css or js
    _fillUpGruntFilesWithPattern(abspath, targetFilePath, pattern, files, staticBlock);
  };

  // Change 'assets/mdeditor.min.js' to 'assets/' and 'mdeditor.min.js'
  // The passed in targetFilePath should have been checked start with 'destPath' and end with '.css/.js'
  var _splitPathAndFilename = function (targetFilePath) {
    var splitPaths = targetFilePath.split('/');
    var targetFilename = splitPaths.pop();
    var targetPath = splitPaths.join('/');
    targetPath = targetPath + '/';
    return [targetPath, targetFilename];
  };

  /**
   * srcFiles: contains all template path like views/home.tpl
   * destPath: the destination path that will be used to store all the result files like 'static/assets'
   */
  var _beginmin = function (srcFiles, destPath) {
    // Iterate over all specified file groups.
    srcFiles.map(grunt.file.read).forEach(function (fileContent, i) {
        var abspath = srcFiles[i];
        var results = fileContent.match(applyminGlobal.beginminPattern_global);
        if (results) {
            var beginminInfo = {};
            for (var index in results) {
                var result = results[index].match(applyminGlobal.beginminPattern);
                var beginEndMinBlock = result[0];
                var targetUrlPath = result[1];
                var staticBlock = result[2];  // static block, maybe css/js
                var targetFilePath = targetUrlPath.match(new RegExp(destPath + '/' + '\\S+\\.(css|js)', 'i'));
                if (!targetFilePath) {
                    grunt.warn('In the file: ' + abspath + ', the target filename in ' + targetUrlPath + ' should start with ' + destPath + '/' + ' and end with .css or .js');
                }
                targetFilePath = targetFilePath[0];
                _handleStaticBlock(abspath, targetFilePath, staticBlock);
                if (targetFilePath in beginminInfo) {
                    grunt.warn('In the file: ' + abspath + ', the target filename ' + targetFilePath + ' should not be duplicated.');
                }
                beginminInfo[targetFilePath] = {targetUrlPath:targetUrlPath, beginEndMinBlock:beginEndMinBlock};
            }
            // Store results for the applymin later.
            applyminGlobal.beginminInfos[abspath] = beginminInfo;
        }
    });
  };

  /**
   * Get the revTargetFilePath based on targetFilePath.
   */
  var _getRevTargetFilePath = function (targetFilePath, abspaths) {
    // Change 'assets/mdeditor.min.js' to 'assets/' and 'mdeditor.min.js'
    var pathFilename = _splitPathAndFilename(targetFilePath);
    var targetPath = pathFilename[0];
    var targetFilename = pathFilename[1];

    // bug fix: assets/xxxxxxxx.mdeditor.min.js, xxxxxxxx can't contain '/' or white character
    // otherwise 'assets/mdeditor/1111.mmm.min.js' matched target filename: 'assets/mmm.min.js', which is incorrect.
    var filenamePattern = new RegExp(targetPath + '[^\\/\\s]+?\\.' + targetFilename);

    // Find the revision file based on targetFilePath defined in html template, if there are multiple files matched, pick up the latest one.
    var revTargetFilePath = null;
    var revTargetFileModifyTime = null;
    for (var index in abspaths) {
        if (abspaths[index].match(filenamePattern)) { // there could be more than one revision files matched filenamePattern
            // match the first revision file.
            if (revTargetFilePath === null) {
                revTargetFilePath = abspaths[index];
            // match the one more revision files, pick up the latest files.
            } else {
                if (revTargetFileModifyTime === null) {
                    revTargetFileModifyTime = fs.lstatSync(revTargetFilePath).mtime;
                }
                var currentFileModifyTime = fs.lstatSync(abspaths[index]).mtime;
                if (currentFileModifyTime > revTargetFileModifyTime) {
                    revTargetFilePath = abspaths[index];
                    revTargetFileModifyTime = currentFileModifyTime;
                }
            }
        }
    }
    if (revTargetFilePath === null) {
        grunt.warn('In the file: ' + templateFilename + ', the target filename: ' + targetFilePath + ' has not been handled to produce a corresponding revision file.');
    }
    return revTargetFilePath;
  };

  /*
   * destPath: the destination path that will be used to store all the result files like 'static/assets'
   *
   * Replace the css/js revision in html template files.
   */
  var _endmin = function(destPath) {

    // Store all the css/js abspaths
    var cssAbspaths = [];
    var jsAbspaths = [];
    grunt.file.recurse(destPath, function(abspath, rootdir, subdir, filename) {
        if (abspath.match(/\.css$/i)) {
            cssAbspaths.push(abspath);
        } else if (abspath.match(/\.js$/i)) {
            jsAbspaths.push(abspath);
        }
    });

    var beginminInfos = applyminGlobal.beginminInfos;
    for (var templateFilename in beginminInfos) {
        var beginminInfo = beginminInfos[templateFilename];
        // Will be used to replace the html template later.
        var replaceContent = {};

        for (var targetFilePath in beginminInfo) {
            var targetUrlPath = beginminInfo[targetFilePath].targetUrlPath;
            var beginEndMinBlock = beginminInfo[targetFilePath].beginEndMinBlock;

            var abspaths = null;
            var isJsOrCss = true; /* true means Js, otherwise means Css. */
            if (targetFilePath.match(/\.css$/i)) {
                abspaths = cssAbspaths;
                isJsOrCss = false;
            } else if (targetFilePath.match(/\.js$/i)) {
                abspaths = jsAbspaths;
            }
            var revTargetFilePath = _getRevTargetFilePath(targetFilePath, abspaths);

            // Fill up replaceContent
            var targetUrlPath = targetUrlPath.replace(new RegExp(targetFilePath, 'i'), revTargetFilePath);
            if (isJsOrCss) {
                targetUrlPath = '<script src="' + targetUrlPath + '"></script>';
            } else {
                targetUrlPath = '<link href="' + targetUrlPath + '" rel="stylesheet" media="screen">';
            }
            replaceContent[targetUrlPath] = beginEndMinBlock;
        }
        var fileContent = grunt.file.read(templateFilename);
        for (var targetUrlPath in replaceContent) {
            var beginEndMinBlock = replaceContent[targetUrlPath];
            while (fileContent.indexOf(beginEndMinBlock) !== -1) { // replace all for string as the first parameter instead of regexp.
                grunt.log.writeln('Change:\n' + beginEndMinBlock);
                fileContent = fileContent.replace(beginEndMinBlock, targetUrlPath);
                grunt.log.writeln('To:\n' + targetUrlPath);
                grunt.log.writeln();
            }
        }
        grunt.file.write(templateFilename, fileContent);
        grunt.log.write('The file named: ' + templateFilename + ' has been changed...').ok();
    }
  };

  grunt.registerMultiTask('applymin', 'Concat, minify and revisioning css/js files in html template page and easily switch optimized/raw css/js references in the html template files.', function () {
      var applymin = grunt.config('applymin');
      var srcFiles = applymin['beginmin'];
      var destPath = applymin['endmin'];
      if (destPath.match(/\/$/)) { // Get rid of the last '/' if there is in destPath.
          destPath = destPath.substring(0, destPath.length - 1);
      }
      var options = this.options({
          // default value
          staticPattern: /['"](.*?\.(css|js))['"]/i
      });
      if (this.target === 'beginmin') {

          applyminGlobal.staticPattern = options.staticPattern;
          srcFiles = grunt.file.expand(srcFiles);
          _beginmin(srcFiles, destPath);

          // Get concat/uglify/cssmin, set key named 'applyminFiles' with filled files and write back to config.
          var concat = grunt.config('concat') || {};
          var uglify = grunt.config('uglify') || {};
          var cssmin = grunt.config('cssmin') || {};
          var rev = grunt.config('rev') || {};
          concat['applymin'] = {};
          uglify['applymin'] = {};
          cssmin['applymin'] = {};
          rev['applymin'] = {};
          concat['applymin']['files'] = applyminGlobal.concatFiles;
          uglify['applymin']['files'] = applyminGlobal.uglifyFiles;
          cssmin['applymin']['files'] = applyminGlobal.cssminFiles;
          rev['applymin']['src'] = applyminGlobal.revFiles;
          grunt.config('concat', concat);
          grunt.config('uglify', uglify);
          grunt.config('cssmin', cssmin);
          grunt.config('rev', rev);
      } else if (this.target === 'endmin') {
          if (!grunt.file.exists(destPath)) {
              grunt.warn('The output folder: ' + destPath + ' does not exist.');
          }
          _endmin(destPath);
      }
  });


};
