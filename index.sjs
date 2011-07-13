(function() {
    include('template'); // load the library, or configure on your v8cgi.conf
    var session = new (require("session").Session)(request, response); 

    var db = include('./db.sjs').db;
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );

    var data = {
        tweets: db.get_tweets(),
        username: session.get('username'),
    };
    
    if (data.username) {
        data.followers = db.get_user(data.username).followers;
    }
    
    response.write(t.process('index', data));
})();

