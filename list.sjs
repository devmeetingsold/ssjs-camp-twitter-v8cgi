(function() {
    include('template'); // load the library, or configure on your v8cgi.conf
    var session = new (require("session").Session)(request, response); 

    var db = include('./db.sjs').db;
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );

    var data = {
        username: session.get('username'),
    };
    
    if (data.username) {
        data.followers = db.get_user(data.username).followers;
        
        data.tweets = db.get_followed_tweets(data.username);
    } else {
        data.tweets = db.get_tweets();
        data.error = "Please log in";
    }
    
    response.write(t.process('index', data));
})();

