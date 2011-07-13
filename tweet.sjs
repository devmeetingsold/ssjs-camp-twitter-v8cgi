(function() {
    include('template'); // load the library, or configure on your v8cgi.conf
    var session = new (require("session").Session)(request, response); 
    var user = session.get('username');
    var msg = request.get['msg'];
    var db = include('./db.sjs').db;
    
    var data = {username: user};
    if (user && msg) {
        db.post_tweet(user, msg);
    } else {
        data.error = "Please log in";
    }
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );

    data.tweets = db.get_tweets();
    data.username = session.get('username');
    
    if (data.username) {
        data.followers = db.get_user(data.username).followers;
    }
    
    response.write(t.process('index', data));
})();

