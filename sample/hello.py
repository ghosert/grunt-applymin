from bottle import route, view, run, template, static_file


@route('/')
@view('home')
def home():

    domain_url = 'http://localhost:8080'
    return dict(domain_url=domain_url)

@route('/static/<filepath:path>')
def server_static(filepath):
    print filepath
    return static_file(filepath, root='./static/')

run(host='localhost', port=8080, debug=True, reloader=True)
