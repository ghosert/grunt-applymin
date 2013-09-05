from bottle import route, view, run, template, static_file


@route('/')
@view('home')
def home():

    # Change static_minified below between True and False
    # Reload http://localhost:8080 to see the css/js url changes in the html source.
    static_minified = False

    domain_url = 'http://localhost:8080'
    return dict(domain_url=domain_url, static_minified=static_minified)

@route('/static/<filepath:path>')
def server_static(filepath):
    print filepath
    return static_file(filepath, root='./static/')

run(host='localhost', port=8080, debug=True, reloader=True)
