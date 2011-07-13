(function() {
    include('template'); // load the library, or configure on your v8cgi.conf
    var session = new (require("session").Session)(request, response); 

    var db = include('./db.sjs').db;
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );

    var data = {
        username: session.get('username'),
    };
    
    data.tweets = db.get_tweets();
    
    if (data.username) {
        var userToFollow = request.get['username'];
        var follow = request.get['action'];
        if (follow === 'true') {
            var ret = db.follow(data.username, userToFollow);
            if (ret.error) {
                data.error = ret.error;
            }
        } else {
            var ret = db.stopFollowing(data.username, userToFollow);
            if (ret.error) {
                data.error = ret.error;
            }
        }
    } else {
        data.error = "Please log in";
    }
    
    if (data.username) {
        data.followers = db.get_user(data.username).followers;
    }
    
    response.write(t.process('index', data));
})();

