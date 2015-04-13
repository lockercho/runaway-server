module.exports = function(io){
    var Promise = require("bluebird");
    var express = require('express');
    var router = express.Router();
    var db = require('../db.js');

    var sockets = {};

    // set websocket functions
    io.on('connection', function(socket){
        // socket.handshake.query.player
        console.log('[io connect] game_id: ', socket.handshake.query.game_id, ', user_id: ',socket.handshake.query.user_id);
        var game_id = socket.handshake.query.game_id;
        var user_id = socket.handshake.query.user_id;
        var sql = "SELECT * FROM user WHERE `game_id`=? AND `id`=?";
        console.log(socket.id);
        var params = [game_id,user_id];
        db.query(sql, params, function(err, result){
            if (err) {
               console.log(err);
            }
            console.log('success');
            console.log('result', result);
            var user = result[0];

            sockets[user_id] = socket;
            sockets[user_id].emit('msg','team:'+user.team+', user_id:'+user.id+ ' connected!');
        });
    });

    /* GET games listing. */
    router.get('/games', function(req, res, next) {
        listGames(req, res, next);
        io.emit('msg','games');
    });

    /* GET games listing. */
    router.get('/games/current', function(req, res, next) {
        getCurrentGameAsync().done(function(game_id) {
            res.send(''+game_id);
        });
    });


    /* GET game status. */
    router.get('/games/:id', function(req, res, next) {
        var game_id = req.params.id;
        getGameStatusAsync(game_id).done(function(status){
            res.json(status);
        });
    });

    /* GET game status. */
    router.get('/games/:id/enter', function(req, res, next) {
        var game_id = req.params.id;
        var team = req.query.team;
        var user_order = req.query.user_order;
        var sql = "UPDATE user SET `status`=? WHERE `game_id`=? AND `team`=? AND `user_order`=?";
        db.query(sql, ['play',game_id, team, user_order], function(err, result){
            if (err) {
               console.log(err);
               return;
            }
            sql = "SELECT * FROM user WHERE `game_id`=? AND `team`=? AND `user_order`=?";
            db.query(sql, [game_id, team, user_order], function(err, result){
                if (err) {
                   console.log(err);
                   return;
                }
                if(result.length > 0) {
                    var user = result[0];

                    // also select game info
                    sql = "SELECT `start_time`,`game_time` FROM game WHERE `id`=?";
                    db.query(sql, [game_id], function(err, result){
                        if (err) {
                           console.log(err);
                           return;
                        }
                        if(result.length > 0) {
                            user.start_time = result[0].start_time;
                            user.game_time = result[0].game_time;
                            res.json(user);
                        } else {
                            res.send('{}');
                        }
                        broadcastGameStatus(game_id);

                    });
                } else {
                    res.send('{}');
                }

            });
        });
    });

    /* reset a game */
    router.get('/games/:id/reset', function(req, res, next) {
        var game_id = req.params.id;
        var sql = "UPDATE user SET `status`=? WHERE `game_id`=?";
        db.query(sql, ['idle', game_id], function(err, result){
            res.end();
        });
    });

    /* get game detail*/
    router.get('/games/:id/detail', function(req, res, next) {
        var sql = "SELECT * FROM user WHERE `game_id`=?";
        var params = [req.params.id];
        db.query( sql, params, function(err, result) {
            if (err) {
                console.log(err);
            }
            var i, t;
            var order_list = [];
            var data = [];
            for(i in result) {
                t = result[i].team;
                if(typeof order_list[t] == 'undefined') {
                    order_list[t] = 1;
                }
                result[i].order = order_list[t];
                order_list[t]++;
                if(typeof data[t] == 'undefined') {
                    data[t] = {
                        team: t,
                       team_name: t == '0' ? 'A': t == '1' ? 'B' : t == '2' ? 'C' : 'D',
                        users: []
                    };
                }
                data[t].users.push(result[i]);
            }
            res.json(data);
          });
    });

    /* Create new game */ 
    router.post('/games', function(req, res, next) {
        var sql = "INSERT INTO game (`start_time`,`game_time`,`status`) VALUES (?, ? ,'idle')";
        var params = [
            req.body.start_time,
            req.body.game_time
        ];
        db.query(sql, params, function(err, result){
            if(!err) {
                var game_id = result.insertId;
                console.log('Create game, id:',game_id);
                // update each user
                var users;
                try{
                    users = JSON.parse(req.body.users);
                    // console.log(users);
                    if(users.length > 0) {
                        var user;
                        sql = "INSERT INTO user (`game_id`,`team`,`user_order`,`number`,`status`) VALUES ";
                        for(var i in users) {
                            user = users[i];
                            sql += '('+game_id +', '+user.team+', '+user.order+', '+user.number+", 'idle') ,";
                        }
                        sql = sql.substr(0, sql.length-1);
                        db.query(sql, function(err, result){
                            if(!err) {
                                console.log('Create users success');
                                res.end(''+game_id);
                            }else {
                                console.log(err);
                            }
                        });
                    }    
                } catch(e) {
                    console.error(e);
                }
                
            } 
        });
    });

    // send message to clients
    router.get('/games/current/broadcast', function(req, res, next){
        getCurrentGameAsync().done(function(game_id) {
            if(game_id === -1) {
                console.log('broadcast to game_id -1, return;');
                res.end();
                return;
            }
            var message = req.query.message;
            broadcast(game_id, false, 'message', message);
            res.end();
        });
    });


    /* GET games listing. */
    router.get('/games/:id', function(req, res, next) {
        listGames(req, res, next);
    });

    /* Update existing game */ 
    router.post('/games/:id', function(req, res, next) {
        var sql = "UPDATE game SET `start_time`=?, `game_time`=? WHERE `id`=?";
        var params = [
            req.body.start_time,
            req.body.game_time,
            req.params.id   
        ];
        console.log(req);
        console.log(params);
        db.query(sql, params, function(err, result){
            if(!err) {
                // update each user
                var users;
                try{
                    users = JSON.parse(req.body.users);
                    console.log(users);
                    if(users.length > 0) {
                        var user;
                        
                        for(var i in users) {
                            user = users[i];
                            (function(db, id, number){
                                var sql = "UPDATE user SET `number`=? WHERE `id`=?";
                                db.query(sql, [number, id], function(err, result){
                                    if(!err) {
                                        console.log('update user', id, 'with number', number);
                                    }
                                    res.end('1');

                                });
                            })(db, user.id, user.number);
                        }
                    }    
                } catch(e) {
                    console.error(e);
                }
                
            } 
        });
    });

    /* delete game. */
    router.post('/games/:id/delete', function(req, res, next) {
        var sql = "DELETE FROM user WHERE `game_id`=?";
        db.query(sql, [req.params.id], function(err, result){
            if(!err ){
                sql = "DELETE FROM game WHERE `id`=?";
                db.query(sql, [req.params.id], function(err, result){
                    if(!err) {
                        res.end('1');
                    }
                });    
            }
        });
    });

    /* GET game status. */
    router.get('/games/:id/kill', function(req, res, next) {
        var game_id = req.params.id;
        var user_id = req.query.user_id;
        var number  = req.query.number;
        
        killPlayer(game_id, user_id, number).done(function(result){
            var now = Math.floor((new Date()).getTime()/1000);
            res.send(result.result);
            if(result.result == 'success') {
                // kill number, lock team
                var user = result.user;
                var team = result.team;
                var killed_id = user.id;
                var i;
                for(i=0; i <team.length ; i++) {
                    if(typeof sockets[team[i].id] != 'undefined') {
                        if(team[i].id == killed_id){
                            sockets[team[i].id].emit('killed', JSON.stringify({timestamp:now}));    
                        } else {
                            sockets[team[i].id].emit('lock', JSON.stringify({timestamp:now}));    
                        }   
                    }
                }
            } else if(result.result == 'fail'){
                // update this player's status
                var sql = "UPDATE user SET `status`='dead' WHERE `id`=?";
                db.query(sql, [user_id], function(err, res){

                });

                // get this user info
                var sql = "SELECT `id` FROM user WHERE `game_id`=? AND `team`=(SELECT `team` FROM user WHERE `id`=?)";
                var user;
                console.log('aa', user_id);
                db.query(sql, [game_id, user_id], function(err, team){
                    console.log(team);
                    if(team.length > 0) {
                        for(i=0; i <team.length ; i++) {
                            user = team[i];
                            if(typeof sockets[user.id] != 'undefined') {
                                if(user.id != user_id){
                                    sockets[user.id].emit('lock', JSON.stringify({timestamp:now}));    
                                }   
                            }
                        }
                    }
                });
            } 
        });
    });

    router.get('/games/:id/exit', function(req, res, next) {
        var user_id = req.query.user_id;
        var sql = "UPDATE user SET `status`='idle' WHERE `id`=?";
        var params = [user_id];
        db.query( sql, params, function(err, result) {
            if (err) {
               console.log(err);
            }

            res.send('1');
            // TODO: unlock other team member
            sql = "SELECT `id`,`status` FROM user WHERE `team`=(SELECT `team` FROM user WHERE `id`=?)";
            db.query(sql, [user_id], function(err, team){
                if(err) {
                    console.log(err);
                }
                if(team.length > 0) {
                    var recover = true;
                    var i;
                    for(i=0 ; i<team.length ; i++){
                        if(team[i].status == 'dead') {
                            recover = false;
                            break;
                        }
                    }
                    if(recover) {
                        var now = Math.floor((new Date()).getTime()/1000);
                        for(i=0 ; i<team.length ; i++){
                            if(typeof sockets[team[i].id] != 'undefined') {
                                sockets[team[i].id].emit('unlock', JSON.stringify({timestamp:now}));    
                            }
                        }
                    }
                }
            });
        });
    });

    

    

    /*====  Handlers  ====*/
    var listGames = function(req, res, next) {
        var sql = "SELECT * FROM game";
        var params = [];
        db.query( sql, params, function(err, result) {
            if (err) {
               console.log(err);
            }
            console.log(result);
            res.json(result);
        });
    };

    var createGame = function(req, res, next) {
        // TODO: create game
        res.send('createGame');
    };

    var updateGame = function(req, res, next) {
        // TODO: update game
        res.send('updateGame');


       
    };

    var deleteGame = function(req, res, next) {
        // TODO: delete game
        res.send('delete game');
    };

    var getCurrentGameAsync = function() {
        return new Promise(function(resolve) {
            var sql = "SELECT `id` FROM game WHERE `status`='idle' OR `status`='playing' ORDER BY `start_time` ASC LIMIT 1";
            db.query(sql, [], function(err, result){
                if (err) {
                   console.log(err);
                }
                if(result.length === 1) {
                    resolve(result[0].id);
                }else {
                    resolve(-1);    
                }
            });
        });
    };

    var getGameStatusAsync = function (game_id) {
        return new Promise(function(resolve) {
            //Without new Promise, this throwing will throw an actual exception
            var sql = "SELECT * FROM game WHERE `id`=?";
            var params = [game_id];

            db.query(sql, params, function(err, result){
                if (err) {
                   console.log(err);
                   return;
                }
                if (result.length === 0) {
                   console.error('No such game, id: '+game_id);
                   return;
                }
                var start_time = result[0].start_time;
                var game_time = result[0].game_time;
                // select users
                sql = "SELECT `team`, count(`id`) AS count FROM user WHERE `game_id`=? AND `status`='play' GROUP BY `team` ";
                db.query( sql, params, function(err, result) {
                    if (err) {
                       console.log(err);
                    }
                    var i,j,count, teams = 4;
                    var arr = [];
                    for( i =0 ; i<teams ; i++){
                        count = 0;
                        for(j=0 ; j< result.length ; j++) {
                            if(result[j].team == i) {
                                count = result[j].count;
                            }
                        }
                        arr[i] = count;
                    }
                    var status = {
                        alive: arr,
                        start_time: start_time,
                        game_time: game_time,
                        packet_time: Math.floor((new Date()).getTime()/1000)
                    };

                    resolve(status);
                });

            }); 
        });
    }

    var getGameStatus = function(req, res, next) {

        console.log('get game status');
        // select game info
        var sql = "SELECT * FROM game WHERE `id`=?";
        var params = [req.params.id];

        db.query(sql, params, function(err, result){
            if (err) {
               console.log(err);
               return;
            }
            if (result.length === 0) {
               console.error('No such game, id: '+req.params.id);
               return;
            }
            var start_time = result[0].start_time;
            var game_time = result[0].game_time;
            // select users
            sql = "SELECT `team`, count(`id`) AS count FROM user WHERE `game_id`=? AND `status`='play' GROUP BY `team` ";
            db.query( sql, params, function(err, result) {
                if (err) {
                   console.log(err);
                }
                var i,j,count, teams = 4;
                var arr = [];
                for( i =0 ; i<teams ; i++){
                    count = 0;
                    for(j=0 ; j< result.length ; j++) {
                        if(result[j].team == i) {
                            count = result[j].count;
                        }
                    }
                    arr[i] = count;
                }
                var status = {
                    alive: arr,
                    start_time: start_time,
                    game_time: game_time,
                    packet_time: Math.floor((new Date()).getTime()/1000)
                };
                console.log(arr);
                res.send(JSON.stringify(status));
            });

        });  
    };

    var killPlayer = function(game_id, user_id, number) {
        return new Promise(function(resolve) {
            var sql = "SELECT `id`,`status`,`team` FROM user WHERE `game_id`=? AND `number`=?";
            var params = [game_id,number];
            db.query( sql, params, function(err, result) {
                if (err) {
                   console.log(err);
                }
                if(result.length == 0) {
                    // failed, lock all members in this team
                    resolve({result:'fail'});
                } else {
                    var user = result[0];
                    if(user.status == 'idle') {
                        resolve({
                            result: 'fail'
                        });
                    }else if(user.status == 'play') {
                        var team_id = result.team;
                        // change user status to dead
                        sql = "UPDATE user SET `status`='dead' WHERE `id`=?";
                        db.query( sql, [result[0].id], function(err, result) {
                            if (err) {
                               console.log(err);
                            }

                            sql = "SELECT `id` FROM user WHERE `game_id`=? AND `team`=?";
                            db.query(sql, [game_id, user.team], function(err, result){
                                if (err) {
                                   console.log(err);
                                }
                                if(result.length > 0) {
                                    resolve({
                                        result:'success',
                                        user: user,
                                        team: result
                                    });    
                                }
                            });
                            
                        });
                        // TODO: lock other team member
                    }else {
                        // dead, rip
                        resolve({
                            result: 'invalid'
                        });
                    }
                }
            });

        });
    };

    var broadcast = function(game_id, team_id, tag, data) {
        console.log('broadcast: ', game_id, ', ',team_id, ', ',tag, ', ',data );
        var sql = "SELECT `id` FROM user WHERE `game_id`=? ";
        var param = [game_id];
        if(team_id !== false) {
            sql += 'AND `team`=? ';
            param.push(team_id);
        }
        db.query(sql, param, function(err, result){
            if (err) {
               console.log(err);
            }
            if(result.length > 0) {
                var i ;
                for(i=0 ;i <result.length ; i++){
                    if(typeof sockets[result[i].id] != 'undefined') {
			console.log(result[i]);                     
   sockets[result[i].id].emit(tag,data);    
                    }
                }
            }
        });
    };

    var broadcastGameStatus = function(game_id) {
        getGameStatusAsync(game_id).done(function(status){
            var sql = "SELECT `id` FROM user WHERE `game_id`=?";
            db.query(sql, [game_id], function(err, result){
                if (err) {
                   console.log(err);
                }
                if(result.length > 0) {
                    var i;
                    for(i=0 ; i<result.length ; i++) {
                        if(typeof sockets[result[i].id] != 'undefined') {
                            sockets[result[i].id].emit('game_status', JSON.stringify(status));    
                        }
                    }
                }
            });
        });
    };


    // check DB every 5 seconds
    setInterval(function(){
        // select games to be started
        var timestamp = Math.floor((new Date()).getTime()/1000);
        var sql = "SELECT `id` FROM game WHERE `status`='idle' AND `start_time`<?";
        db.query(sql, [timestamp], function(err, result){
            if(err) {
                return;
            }
            if(result.length > 0) {
                sql = "UPDATE game SET `status`='playing' WHERE `id` IN (";
                var condition = "";
                var params = [];
                var i;
                for(i in result) {
                    params.push(result[i].id);
                    condition += '?,';
                }
                condition = condition.substr(0, condition.length -1);
                sql = sql + condition + ')';
                db.query(sql, params, function(err, result){
                    if(err) {
                        console.log(err);
                    }

                    // update users status
                    sql = "UPDATE user SET `status`='idle' WHERE `game_id` IN ("+condition+')';
                    db.query(sql, params, function(err, result){
                        if(err) {
                            console.log(err);
                        }
                    });

                });
            }
        });

        // select games to be ended
        var timestamp = Math.floor((new Date()).getTime()/1000);
        var sql = "SELECT * FROM game WHERE `status`='playing'";
        db.query(sql, [timestamp], function(err, result){
            if(err) {
                return;
            }
            if(result.length > 0) {
                var params = [];
                sql = "UPDATE game SET `status`='end' WHERE `id` IN (";
                var i, t, gt;
                for(i in result) {
                    t = parseInt(result[i].start_time);
                    gt = t + 60 * parseInt(result[i].game_time);
                    if(gt < timestamp) {
                        params.push(result[i].id);
                        sql += '?,';    
                    }
                }
                if(params.length > 0) {
                    sql = sql.substr(0, sql.length -1) + ')';
                    console.log('sql', sql);
                    db.query(sql, params, function(err, result){
                        if(err) {
                            console.log(err);
                        }
                    });    
                }
            }
        });

    }, 5000);

    return router;
};
