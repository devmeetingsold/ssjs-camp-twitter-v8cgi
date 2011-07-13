(function() {
    request = this.request || { get:  {} };
    response = this.response || { write: function(str) { system.stdout(str); } };
    
    include('template');
    var session = new (require("session").Session)(request, response); 
    
    var db = include('./db.sjs').db;

    session.clear();

    var data = {};
    data.tweets = db.get_tweets();
    
    var t = new Template( { 'path' : './templates/' , 'suffix' : 'html' } );
    response.write(t.process('index' , data));
})();

