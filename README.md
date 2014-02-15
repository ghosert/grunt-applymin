# grunt-applymin

> Concat, minify and revisioning css/js files in html template page and easily replace raw css/js references in the html template files.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-applymin --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-applymin');
```

## Key idea

This is a project for the comprehensive solution to concat/minify/revisioning css/js files and easily replace raw css/js references in the html template, ideally support any dynamic web site written by Java/Python/Ruby/PHP etc.

The sample case is based on the simple, lightweight micro web-framework Bottle for Python. You could leverage the idea to other framework or Java/Ruby/PHP based web development.

## Run the demo

#### Prerequisite

1. Python and NodeJs is prerequisite to run the demo
2. Install grunt by: `sudo npm install -g grunt-cli`
3. `cd grunt-applymin/sample`, run `npm install` to install project dependencies

#### Start demo

```
1. cd grunt-applymin/sample
2. python hello.py
3. visit http://localhost:8080/
```

Go through the demo codes in `grunt-applymin/sample`, it demonstrates the least system how the grunt-applymin works.

## How it works

**1.** Use customized html comments in html template to define the css/js blocks you want to concat/minify/revisioning and their output filenames, e.g.

```
<!-- beginmin: {{domain_url}}/static/assets/main.lib.min.css -->
<link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
<link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
<!-- endmin -->
```

In this case, `bootstrap.css` and `bootstrap-responsive.css` are wrapped with `beginmin/endmin`,  which means they are planned to concat/minify/revision together.  
The specified `static/assets/main.lib.min.css` will be the output filename.

**2.** When your template file is ready like above, run 'grunt' to produce minified `static/assets/main.lib.min.css` with the revision filename e.g. `12345678.main.lib.min.css`, and grunt-applymin will update html template with this revision filename automatically, for example, change:

```
<!-- beginmin: {{domain_url}}/static/assets/main.lib.min.css -->
<link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
<link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
<!-- endmin -->
```

To:

```
<link href="{{domain_url}}/static/assets/12345678.main.lib.min.css" rel="stylesheet" media="screen">
```

Since the change will happen on your html template, make sure you copied the html template to the "build" or "dist" folder before you run "grunt" to update html template.

**3.** Any time you changed raw css/js or add/remove css/js references between

```html
<!-- beginmin: static/main.min.js -->

<!-- endmin -->
```
just re-run grunt to update the new revision filename in html template, the revision filename is based on file content, it should be same if nothing changed.

Run the demo and see how it works in details.


html template sample is located at `grunt-applymin/sample/views/home.tpl`


## Dependencies

The underneath concat/minify/revisioning is based on the grunt plugins:

* grunt-contrib-concat
* grunt-contrib-uglify
* grunt-contrib-cssmin
* grunt-rev

And you could define a default task in `Gruntfile.js` like this to make them work:

```
grunt.registerTask('default', ['applymin:beginmin', 'concat', 'uglify', 'cssmin', 'rev', 'applymin:endmin']);
```

Because of the `<!-- beginmin --><!-- endmin -->` you added in the html template files, you don't have to manually set the `src/dest/files` paths for `concat/uglify/cssmin/rev` tasks, grunt-applymin will do it for you automatically.

Take a look at `grunt-applymin/sample/Gruntfile.js` to see how they work together with grunt-applymin.

## The "applymin" task

### Overview
In your project's Gruntfile, add a section named `applymin` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    applymin: {
        options: {
            staticPattern: /(static\/.*?\.(css|js))/i,
        },
        beginmin: 'views/**/*.tpl',
        endmin: 'static/assets'
    },
})
```

### Options

#### options.staticPattern
Type: `RegExp`
Default value: `/['"](.*?\.(css|js))['"]/i`

A RegExp value to fetch the paths of the css/js resources in `<link>` or `<script>` html tags within `<!-- beginmin --><!-- endmin -->` blocks. Suppose your html template looks like below:
    
```
<!-- beginmin: static/assets/main.lib.min.css -->
<link href="static/css/bootstrap.css" rel="stylesheet" media="screen">
<link href="static/css/bootstrap-responsive.css" rel="stylesheet">
<!-- endmin -->
```

The default value of `options.staticPattern` will then match this block and fetch the paths of the resources: `['static/css/bootstrap.css', 'static/css/bootstrap-responsvie.css']`, this will be used to produce the output file `static/assets/main.lib.min.css` later, so just ensure your pattern is good enough to fetch the paths and the paths are accessable to your `Gruntfile.js`.

For example, in some cases, your css/js tags could contain the backend variable in it like below:

```
<!-- beginmin: {{domain_url}}/static/assets/main.lib.min.css -->
<link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
<link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
<!-- endmin -->
```

To fetch the actual filepath: `static/css/bootstrap.css` for grunt-applymin, you should then change this option to: `staticPattern: /(static\/.*?\.(css|js))/i`


### beginmin/endmin targets

```js
applymin: {
    options: {
        staticPattern: /(static\/.*?\.(css|js))/i
    },
    beginmin: 'views/**/*.tpl',
    endmin: 'static/assets'
},
```

#### beginmin

beginmin: `'views/**/*.tpl'`

Specify the template files to `beginmin` target, in the sample above, grunt-applymin will search all the `.tpl` files in `views` folder recursively, and see if there are beginmin/endmin blocks to be handled. If you are using other template engine, you should change the appendix to `*.jsp/*.php/*.mako`, etc.

#### endmin

endmin: `'static/assets'`

Specify the output path to store the minified css/js files. Since this is the folder to store minified files, you should make sure the name of the target filepath in html template should start with it. Otherwise, grunt-applymin will report warning. For example, in html template you write down:

```
<!-- beginmin: assets/main.lib.min.css -->
<!-- endmin -->
```

And at the same time, in the `applymin:endmin` target you write down:

endmin: 'static/assets'

This will lead to warning, since `endmin: 'static/assets'` means your minified files will be in `static/assets` instead of `assets` mentioned in html template. They are inconsistent. To make it right, change html template like this:

```
<!-- beginmin: static/assets/main.lib.min.css -->
<!-- endmin -->
```

### Error/Warn info

When running `grunt`, grunt-applymin will also prompt you the error/warn info if there is, such as:

1. The css/js files in html doesn't exist.
2. The folder name in endmin target is inconsistent with beginmin comments in html template.
3. Intend to combine different beginmin/endmin html blocks to the same minified filename.

You don't have to worry about this, if you see the error/warn info, just make sure you take care of them and correct them to make it work.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

* 2013-09-07 / v0.1.0 / initial commit
* 2013-09-10 / v0.1.1 / bug fix on RegExp and the same pattern on multiple revision files.
* 2013-09-10 / v0.1.2 / Better prompt for options.staticPattern issue.
* 2013-09-22 / v0.1.3 / Fix the issue when there are duplicate filenames in different folders
* 2014-02-15 / v0.2.0 / Take the `static_minified` variable out, which is designed to switch raw/optimized css/js file. Means it will only replace the beginmin/endmin block with the optimized css/js instead of switch, this will make the plugin easier to use.

