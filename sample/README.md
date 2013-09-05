grunt-applymin
==============

Concat, minify and revisioning css/js files in html template page and easily switch optimized/raw css/js references in the html template files.


## Key idea

This is a project for the comprehensive solution to concat/minify/revisioning css/js files and easily switch optimized/raw css/js references in the html template, ideally support any dynamic web site written by Java/Python/Ruby/PHP etc.

The sample case is based on the simple, lightweight micro web-framework Bottle for Python. You could leverage the idea to other framework or Java/Ruby/PHP based web development.


## Run the demo

#### Prerequisite

1. Python and NodeJs is prerequisite to run the demo
2. Install grunt by: 'sudo npm install -g grunt-cli'
3. `cd grunt-applymin/static`, run `npm install` to install project dependencies

#### Start demo

```
1. cd grunt-applymin
2. python hello.py
3. visit http://localhost:8080/
```

## How it works

**1.** Define a server side variable and pass to html template, e.g. 'static_minified = True'

**2.** Use customized html comments in html template to define the css/js blocks you want to concat/minify/revisioning and the output filename, e.g.

```
<!-- beginmin: assets/main.lib.min.css -->
<link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
<link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
<!-- endmin -->
```

In this case, means `bootstrap.css/bootstrap-responsive.css` wrapped with `beginmin/endmin` are planned to combine and the `assets/main.lib.min.css` will be the output filename.


**3.** Use 'static_minified' passed from server side to switch optimized/raw css/js references in html template like below:

```
%if static_minified == True:
    <link href="{{domain_url}}/static/assets/main.lib.min.css" rel="stylesheet" media="screen">
%else:
    <!-- beginmin: assets/main.lib.min.css -->
    <link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
    <link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
    <!-- endmin -->
%end
```

**4.** When your template file is ready like above, run 'grunt' to produce minified `assets/main.lib.min.css` with the revision filename e.g. `12345678.main.lib.min.css`, and grunt-applymin will update html template with this revision filename, for example, change:

```
<link href="{{domain_url}}/static/assets/main.lib.min.css" rel="stylesheet" media="screen">
```

To:

```
<link href="{{domain_url}}/static/assets/12345678.main.lib.min.css" rel="stylesheet" media="screen">
```

So that now you have one single html template but contains both optimized/raw css/js references, and could be easily switched by 'static_minified', suggest 'True' in production, 'False' in development.

**5.** Any time you changed raw css/js or add/remove css/js references between '<!-- beginmin --><!-- endmin -->', just re-run grunt to update the new revision filename in html template, the revision filename is based on file content, it will be same if nothing changed.

Run the demo and see how it works in details.

1. 'static_minified' mentioned is located at `grunt-applymin/hello.py`
2. html template sample is located at `grunt-applymin/views/home.tpl`


Have fun !




