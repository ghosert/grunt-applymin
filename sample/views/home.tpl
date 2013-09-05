<html>
<head>
    <meta charset="utf-8">
    <title>grunt-applymin demo page</title>

		%if static_minified == True:
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="{{domain_url}}/static/assets/main.lib.min.css" rel="stylesheet" media="screen">
            <link href="{{domain_url}}/static/assets/main.min.css" rel="stylesheet" media="screen">
		%else:
            <!-- beginmin: assets/main.lib.min.css -->
            <link href="{{domain_url}}/static/css/bootstrap.css" rel="stylesheet" media="screen">
            <link href="{{domain_url}}/static/css/smoothness/jquery-ui-1.10.2.custom.css" rel="stylesheet" media="screen">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="{{domain_url}}/static/css/bootstrap-responsive.css" rel="stylesheet">
            <!-- endmin -->

            <!-- beginmin: assets/main.min.css -->
            <link href="{{domain_url}}/static/css/main.css" rel="stylesheet">
            <!-- endmin -->
		%end
</head>
<body>

	<div id="container">
		<h2>
		This is a demo page for grunt-applymin
		</h2>
		<ol>
			<li> Reload this page, you will see 8 requests in browser for css/js</li>
			<li> 'cd grunt-applymin/static', run 'grunt' to combine/minify/revisioning js/css files.</li>
			<li> Edit 'grunt-applymin/hello.py', change 'static_minified = False' to True</li>
			<li> Reload 'http://localhost:8080/', ONLY 3 requests now in browser for minified css/js</li>
		</ol>
	</div>

	%if static_minified == True:
		<script src="{{domain_url}}/static/assets/main.lib.min.js"></script>
	%else:
		<!-- beginmin: assets/main.lib.min.js -->
		<script src="{{domain_url}}/static/js/libs/jquery-1.8.3.js"></script>
		<script src="{{domain_url}}/static/js/libs/jquery-ui-1.10.2.custom.js"></script>
		<script src="{{domain_url}}/static/js/libs/bootstrap.js"></script>
		<script src="{{domain_url}}/static/js/libs/jquery.storage.js"></script>
		<!-- endmin -->
	%end
</body>
</html>
    
