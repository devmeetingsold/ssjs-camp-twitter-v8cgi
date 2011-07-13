(function() {
    var HTTP = include('http');
    request = this.request || { get:  [] };
    var HOST = "10.1.1.148";
    var PORT = "5984";
    var MOCK = false;
    
    exports.db = (function() {
        var get_all = function(db) {
            var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/" + db + "/_all_docs?include_docs=true");
            var response = client.send(true);
            return JSON.parse(response.data.toString('UTF-8'));
        };
        
        var get = function(db, id) {
            var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/" + db + "/" + id);
            var response = client.send(true);
            return JSON.parse(response.data.toString('UTF-8'));
        }
        
        var put = function(db, id, data) {
        	var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/" + db + "/" + id);
			client.method = 'PUT';
			client.header({'Content-Type' : 'application/json'});
			client.post = JSON.stringify(data);
			return client.send(true);
        }
        
        var mock = function() {
            var tweets = [
                {author: "aaa", msg: "tweet1", timestamp: 0},
                {author: "aaa", msg: "tweet2", timestamp: 1},
                {author: "bbb", msg: "tweet1", timestamp: 2},
                {author: "bbb", msg: "tweet2", timestamp: 3},
            ];
        
            var users = [
                {id: "aaa", followers: []},
                {id: "bbb", followers: ["aaa"]}
            ];
            
             var interface = {
                get_tweets: function(user) {
                    var ret;
                    if (user) {
                        ret = [];
                        for (var i in tweets) {
                            if (tweets[i].author === user) {
                                ret.push(tweets[i]);
                            }
                        }
                    } else {
                        ret = tweets;
                    }
                    return JSON.parse(JSON.stringify(ret));
                },
                
                get_user: function(user) {
                    var ret = [];
                    for (var i in users) {
                        if (users[i].id === user) {
                            ret.push(users[i]);
                        }
                    }
                    return JSON.parse(JSON.stringify(ret));
                },
                
                post_tweet: function(author, msg) {
                    tweets.push({author: author, msg: msg, timestamp: tweets.length});
                },
                
                register_user: function(user) {
                    for (var i in users) {
                        if (users[i].id === user) {
                            followers = users[i].followers;
                            return {error: "User already exists", success: false};
                        }
                    }
                    users.push({id: user, followers: []});
                    return {success: true};
                },
                
                get_followed_tweets: function(user) {
                    var followers = [];
                    var ret = [];
                    for (var i in users) {
                        if (users[i].id === user) {
                            followers = users[i].followers;
                            break;
                        }
                    }
                    for (var i in tweets) {
                        if (tweets[i].author in followers) {
                            ret.push(tweets[i]);
                        }
                    }
                    return JSON.parse(JSON.stringify(ret));
                },
                
                follow: function(currentUser, otherUser) {
                    var user; 
                    for (var i in users) {
                        if (users[i].id === currentUser) {
                            user = users[i];
                            break;
                        }
                    }
                    if (!user) {
                        return {error: "No such user", success: false};
                    }
                    user.followers.push(otherUser);
                    return {success: true};
                },
                
                stopFollowing: function(currentUser, otherUser) {
                    var user; 
                    for (var i in users) {
                        if (users[i].id === currentUser) {
                            user = users[i];
                            break;
                        }
                    }
                    if (!user) {
                        return {error: "No such user", success: false};
                    }
                    var index = user.followers.indexOf(otherUser);
                    if (index < 0) {
                        return {error: "User not followed", success: false};
                    }
                    user.followers.splice(index, 1);
                    return {success: true};
                },
                
                test: function() {
                    system.stdout('User ' + users[0].id + ': ' + JSON.stringify(this.get_user(users[0].id)) + '\n');
                    system.stdout('Starting following: ' + this.follow(users[0].id, users[1].id));
                    system.stdout('User ' + users[0].id + ': ' + JSON.stringify(this.get_user(users[0].id)) + '\n');
                    system.stdout('Stopped following: ' + JSON.stringify(this.stopFollowing(users[0].id, users[1].id)) + '\n');
                    system.stdout('Registering user ' + JSON.stringify(this.register_user('aaa')) + '\n');
                    system.stdout('Registering user ' + JSON.stringify(this.register_user('ccc')) + '\n');
                    system.stdout('User ' + users[0].id + ': ' + JSON.stringify(this.get_user(users[0].id)) + '\n');
                    system.stdout('User null: ' + JSON.stringify(this.get_user('null')) + '\n');
                    system.stdout('User ' + users[0].id + ' tweets: ' + JSON.stringify(this.get_tweets(users[0].id)) + '\n');
                    system.stdout('Tweets: ' + JSON.stringify(this.get_tweets()) + '\n');
                }
            };
            
            return interface;
        };
        
        var couch = function() {
            var interface = {
              get_tweets: function(user) {
                var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/tweets/_design/queries/_view/all");
                var response = client.send(true);
                return JSON.parse(response.data.toString('UTF-8')).rows.map(function(v) { return v.value; });
              },                
              get_user: function(user) {
                var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/users/" + user);
                var response = client.send(true);
                return JSON.parse(response.data.toString('UTF-8'));
              },
              get_followed_tweets : function(userId) {
        		// get user followers
        		var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/users/" + userId);
				var resp = client.send(true);
				var userJson = JSON.parse(resp.data.toString('UTF-8'));
				
				var multiKeyQuery = { keys : userJson.followers ? userJson.followers : [] };
				
				var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/tweets/_design/queries/_view/by_author");
				client.method = 'POST';
				client.header({'Content-Type' : 'application/json'});
				client.post = JSON.stringify(multiKeyQuery);
				var resp = client.send(true);
				return JSON.parse(resp.data.toString('UTF-8')).rows.map(function(v) { return v.value; });
        	  },
                
                post_tweet: function(author, msg) {
                  var client = new HTTP.ClientRequest("http://" + HOST + ":" + PORT + "/tweets");
                  client.method = 'POST';
                  client.header({'Content-Type' : 'application/json'});
                  client.post = JSON.stringify({author: author, msg: msg, timestamp: new Date().getTime()});
                  var resp = client.send(true);
                  return {success: true};
                },
                
                register_user: function(user) {
                	put('users', user, {});
					if (user.error) {
						return {error: 'User already exists: '+user.error, success: false};
					}
					
					return {success: true};
                },
                
                follow: function(currentUser, otherUser) {
                    var user = get('users', currentUser);
                    if (user.error) {
						return {error: user.error, success: false};
					}
					
					if (! user.followers) {
						user.followers = [ otherUser ];
					} else {
						var index = user.followers.indexOf(otherUser);
						if (index >= 0) {
				        	return {error: "You already follow "+otherUser, success: false};
						}
						user.followers.push(otherUser);
					}
					put('users', currentUser, user);
					return {success: true};
                },
                
                stopFollowing: function(currentUser, otherUser) {
					// get user followers
					var user = get('users', currentUser);
					if (user.error) {
						return {error: user.error, success: false};
					}
					
					if (! user.followers) {
						return {error : "You're not following "+otherUser, success: false};
					} else {
						var index = user.followers.indexOf(otherUser);
						if (index == -1) {
				        	return {error : "You're not following "+otherUser, success: false};
						}
						user.followers.splice(index, 1);
					}
					
					put('users', currentUser, user);
					return {success: true};
                }
            };
            return interface;
        };
        
        return MOCK ? mock() : couch();
    })();
})();

