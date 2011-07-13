(function() {
    request = this.request || { get:  {} };
    response = this.response || { write: function(str) { system.stdout(str); } };
    
    include('template');
    var session = new (require("session").Session)(request, response); 
    
    var db = include('./db.sjs').db;
    var username = request.get['username'];

    var data = {};
    if (typeof(username) !== 'undefined' && username.trim().length > 0) {
        username = encodeURIComponent(username);
        var user = db.register_user(username);
        if (user.error) {
            session.clear();
            data.error = user.error;
        } else {
            data.username = username;
            data.followers = user.followers;
            session.set('username', username);
        }
    } else {
        data.error = "No username";
    }
    
    data.tweets = db.get_tweets();
    
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );
    response.write(t.process('index' , data));
})();

