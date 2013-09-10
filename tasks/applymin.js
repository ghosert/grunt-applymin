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
      htmlTemplateFiles: {}, // store all the html template names as the key, and css/js minified files and the targetFilePaths as the values.
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
    var _fillUpFilesWithPattern = function (abspath, targetFilePath, pattern, files, staticBlock) {
        if (targetFilePath in files) {
            grunt.warn('In the file: ' + abspath + ', the target filename: ' + targetFilePath + ' has already defined in the other html template file.');
        }
        var results = staticBlock.match(pattern);
        if (results) {
            files[targetFilePath] = [];
            for (var index in results) {
                // results[index] could be like below, use staticPattern to fetch real static filepath further.
                // <link href="${request.static_url('zuoyeproject:static/css/bootstrap.css')}" rel="stylesheet" media="screen">
                // <script src="${request.static_url('zuoyeproject:static/editor/common.js')}">
                var result = results[index].match(applyminGlobal.staticPattern);
                if (!grunt.file.exists(result[1])) {
                    grunt.warn('This file does not exist: "' + result[1] + '"');
                }
                files[targetFilePath].push(result[1]);
            }
        }
    };

  // jiawzhang: collect the css/js filepath from template files and fill up the dist/files in concat/cssmin
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
    _fillUpFilesWithPattern(abspath, targetFilePath, pattern, files, staticBlock);
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

  var _getTargetFileRefrences = function (abspath, fileContent, targetFilePaths, destPath) {
    var fileContentWithoutStaticBlocks = fileContent.replace(applyminGlobal.beginminPattern_global, '');

    // Get all the static files excluding the ones in beginmin comment blocks.
    var cssFiles = fileContentWithoutStaticBlocks.match(applyminGlobal.cssPattern);
    var jsFiles = fileContentWithoutStaticBlocks.match(applyminGlobal.jsPattern);

    // Check the css/js tags contain the targetFilePath or not, if yes, put them to the cssFileRefs/jsFileRefs
    var cssFileRefs = {};
    var jsFileRefs = {};

    for (var fileIndex in targetFilePaths) {

        var targetFilePath = targetFilePaths[fileIndex];

        if (targetFilePath.indexOf(destPath + '/') !== 0) {
            grunt.warn('In the file: ' + abspath + ', the target filename should start with ' + destPath + '/' + ' instead of current one: ' + targetFilePath);
        }

        if (!targetFilePath.match(/\S+\.(css|js)$/i)) {
            grunt.warn('In the file: ' + abspath + ', the target filename should end with .css or .js instead of current one: ' + targetFilePath);
        }

        // Change 'assets/mdeditor.min.js' to 'assets/' and 'mdeditor.min.js'
        var pathFilename = _splitPathAndFilename(targetFilePath);
        var targetPath = pathFilename[0];
        var targetFilename = pathFilename[1];

        // determine the css or js type.
        var refPattern = null;
        var staticFiles = null;
        var staticFileRefs = null;

        if (targetFilePath.match(/\.css$/i)) {
            // <link href="${request.static_url('zuoyeproject:static/assets/mdeditor.lib.min.css')}" rel="stylesheet" media="screen">
            // <link href="${request.static_url('zuoyeproject:static/assets/12345678.mdeditor.lib.min.css')}" rel="stylesheet" media="screen">
            // means /<link\s+href\s*=[\s\S]+?assets/(\S+?\.mdeditor.min.js|mdeditor.min.js)[\s\S]+?>/gi
            refPattern = new RegExp('<link[\\s\\S]+?href\\s*=[\\s\\S]+?' + targetPath + '(\\S+?\\.' + targetFilename + '|' + targetFilename + ')[\\s\\S]+?>', 'i');
            staticFiles = cssFiles;
            staticFileRefs = cssFileRefs;
        } else if (targetFilePath.match(/\.js$/i)) {
            // means /<script\s+src\s*=[\s\S]+?assets/(\S+?\.mdeditor.min.js|mdeditor.min.js)[\s\S]+?>/gi
            refPattern = new RegExp('<script[\\s\\S]+?src\\s*=[\\s\\S]+?' + targetPath + '(\\S+?\\.' + targetFilename + '|' + targetFilename + ')[\\s\\S]+?>', 'i');
            staticFiles = jsFiles;
            staticFileRefs = jsFileRefs;
        }

        // Check whether css/js reference tags contain the targetFilePath in the current html template file.
        var matchedResults = null;
        for (var index in staticFiles) {
            matchedResults = staticFiles[index].match(refPattern);
            if (matchedResults) {
                staticFileRefs[targetFilePath] = staticFiles[index];
                break;
            }
        }
        if (matchedResults === null) {
            grunt.warn('In the file: ' + abspath + ', the target filename: ' + targetFilePath + ' is not referred by any css/js tags.');
        }
    }

    return {cssFileRefs: cssFileRefs, jsFileRefs: jsFileRefs, targetFilePaths: targetFilePaths};
  };

  var _beginmin = function (srcFiles, destPath) {
    // Iterate over all specified file groups.
    srcFiles.map(grunt.file.read).forEach(function (fileContent, i) {
        var abspath = srcFiles[i];
        var results = fileContent.match(applyminGlobal.beginminPattern_global);
        if (results) {
            var targetFilePaths = [];
            var staticBlocks = [];
            for (var index in results) {
                var result = results[index].match(applyminGlobal.beginminPattern);
                targetFilePaths.push(result[1]); // target file path.
                staticBlocks.push(result[2]); // static block, maybe css/js
            }

            // get object contains all the targetFilePath in the css/js tags.
            var targetFileRefs = _getTargetFileRefrences(abspath, fileContent, targetFilePaths, destPath);
            // Store results for the applymin later.
            applyminGlobal.htmlTemplateFiles[abspath] = targetFileRefs;

            // handle each staticBlock.
            for (var fileIndex in targetFilePaths) {
                var targetFilePath = targetFilePaths[fileIndex];
                var staticBlock = staticBlocks[fileIndex];
                _handleStaticBlock(abspath, targetFilePath, staticBlock);
            }
        }
    });
  };

  // Update the css/js revision in html template files.
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

    var htmlTemplateFiles = applyminGlobal.htmlTemplateFiles;
    for (var templateFilename in htmlTemplateFiles) {

        var targetFileRefs = htmlTemplateFiles[templateFilename];

        // Will be used to replace the html template later.
        var changedRevStaticFileRefs = {};
        var isChangedHtmlTemplateFile = false;

        // <link href="${request.static_url('zuoyeproject:static/assets/mdeditor.lib.min.css')}" rel="stylesheet" media="screen">
        for (var fileIndex in targetFileRefs.targetFilePaths) {
            var targetFilePath = targetFileRefs.targetFilePaths[fileIndex];

            // Change 'assets/mdeditor.min.js' to 'assets/' and 'mdeditor.min.js'
            var pathFilename = _splitPathAndFilename(targetFilePath);
            var targetPath = pathFilename[0];
            var targetFilename = pathFilename[1];

            var filenamePattern = new RegExp(targetPath + '\\S+?\\.' + targetFilename);
            var abspaths = null;
            var staticFileRefs = null;
            if (targetFilePath.match(/\.css$/i)) {
                abspaths = cssAbspaths;
                staticFileRefs = targetFileRefs.cssFileRefs;
            } else if (targetFilePath.match(/\.js$/i)) {
                abspaths = jsAbspaths;
                staticFileRefs = targetFileRefs.jsFileRefs;
            }

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

            // Find referred js/cs tags based on targetFilePath defined in html template.
            var staticFileRef = staticFileRefs[targetFilePath];
            if (staticFileRef === undefined) {
                grunt.warn('In the file: ' + templateFilename + ', the target filename: ' + targetFilePath + ' is not referred by any css/js tags.');
            }
            var revStaticFileRef = staticFileRef.replace(new RegExp(targetPath + '(\\S+?\\.' + targetFilename + '|' + targetFilename + ')', 'i'), revTargetFilePath);
            if (revStaticFileRef !== staticFileRef) {
                changedRevStaticFileRefs[staticFileRef] = revStaticFileRef;
                isChangedHtmlTemplateFile = true;
            }
        }
        if (isChangedHtmlTemplateFile) {
            var fileContent = grunt.file.read(templateFilename);
            for (var staticFileRefKey in changedRevStaticFileRefs) {
                while (fileContent.indexOf(staticFileRefKey) !== -1) { // replace all for string as the first parameter instead of regexp.
                    grunt.log.writeln('Change: ' + staticFileRefKey);
                    fileContent = fileContent.replace(staticFileRefKey, changedRevStaticFileRefs[staticFileRefKey]);
                    grunt.log.writeln('To: ' + changedRevStaticFileRefs[staticFileRefKey]);
                    grunt.log.writeln();
                }
            }
            grunt.file.write(templateFilename, fileContent);
            grunt.log.write('The file named: ' + templateFilename + ' has been changed...').ok();
        }
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
