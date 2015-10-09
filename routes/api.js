module.exports = function(io){
    var Promise = require("bluebird");
    var express = require('express');
    var _ = require('underscore');
    var router = express.Router();
    var db = require('../db.js');

    var sockets = {};

    var KillQueue = [];
    var KillQueueLock = false;

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
            broadcastGameStatus(game_id);
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

    router.get('/games/:id/back_to_life', function(req, res, next) {
        var game_id = req.params.id;
        var user_id = req.query.user_id;
        sql = "UPDATE user SET `status`='idle' WHERE `game_id`=? AND `id`=? AND `status`='dead'";
        db.query(sql, [game_id, user_id], function(err, result){
            if(err) {
                res.end();
            }
            res.send('1');

        });
    });

    /* GET game status. */
    router.get('/games/:id/enter', function(req, res, next) {
        var game_id = req.params.id;
        var team = req.query.team;
        var user_order = req.query.user_order;

        // check game status, if game end, don't change user status
        var sql = "SELECT `status` FROM game WHERE `id`=?";
        db.query(sql, [game_id], function(err, result){
            if(err) {
                console.log(err);
                return;
            }

            if(result.length < 1) {
                console.log('No such game, id = '+game_id);
                return;   
            }
             var status = result[0].status;

            if(status == 'end') {
                sendEnterGameData(res, game_id, team, user_order);    
            } else {
                sql = "SELECT `status` FROM user WHERE `game_id`=? AND `team`=? AND `user_order`=?";
                db.query(sql, [game_id, team, user_order], function(err, result) {
                    var status = result[0].status;
                    console.log('status', status);
                    if(status == 'dead') {
                        sendEnterGameData(res, game_id, team, user_order);
                    } else {
                        sql = "UPDATE user SET `status`=? WHERE `game_id`=? AND `team`=? AND `user_order`=?";
                        db.query(sql, ['play',game_id, team, user_order], function(err, result){
                            if (err) {
                               console.log(err);
                               return;
                            }
                            sendEnterGameData(res, game_id, team, user_order);        
                        });
                    }
                });
               
            }
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
    router.post('/games/:id/broadcast', function(req, res, next){
        var game_id = req.params.id;
        var message = req.body.message;
        broadcast(game_id, false, 'message', message);
        res.end();
    });

    // get hisory message of this game
    router.get('/games/:id/broadcast', function(req, res, next){
        var game_id = req.params.id;
        var sql = "SELECT * FROM message_history WHERE `game_id`=?";
        var param = [game_id];
        db.query(sql, param, function(err, result) {
            if(err) {
                console.log(err);
                res.end();
                return;
            }
            res.json(result);
        });
    });

    /* Force game end. */
    router.get('/games/:id/force_end', function(req, res, next) {
        var game_id = req.params.id;
        var sql = "UPDATE game SET `status`='end' WHERE `id`=?";
        db.query(sql, [game_id], function(err, result){
            if(err) {
                res.end();
                return;
            }
            res.send('1');
            checkGameEnd(game_id, true);
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

        doKillPlayer(game_id, user_id, number, function(result){
            var now = Math.floor((new Date()).getTime()/1000);
            res.send(result.result);
            if(result.result == 'success') {
                // kill number, lock team
                var user = result.user;
                var team = result.team;
                var team_id;
                var killed_id = user.id;
                var i;
                console.log('team', team);
                for(i=0; i <team.length ; i++) {
                    team_id = team[i].team;
                    if(typeof sockets[team[i].id] != 'undefined') {
                        if(team[i].id == killed_id){
                            sockets[team[i].id].emit('killed', JSON.stringify({timestamp:now}));    
                        } else {
                            sockets[team[i].id].emit('lock', JSON.stringify({timestamp:now}));    
                        }   
                    }
                }
                console.log('team_id', team_id);
                getTeamName().done(function(team_names){
                    var team_name = team_names[team_id];
                    broadcast(game_id, false, 'message', team_name + ' 有人被殺了！');
                    broadcastGameStatus(game_id).done(function(){
                        checkGameEnd();    
                    });
                });
                
                
            } else if(result.result == 'fail'){
                if(user_id == 0) {
                    return;
                }

                // update this player's status
                var sql = "UPDATE user SET `status`='dead' WHERE `id`=?";
                db.query(sql, [user_id], function(err, res){

                });
                
                var team_id;

                // get this user info
                var sql = "SELECT `id`,`team` FROM user WHERE `game_id`=? AND `team`=(SELECT `team` FROM user WHERE `id`=?)";
                var user;
                console.log('aa', user_id);
                db.query(sql, [game_id, user_id], function(err, team){
                    console.log(team);
                    if(team.length > 0) {
                        for(i=0; i <team.length ; i++) {
                            user = team[i];
                            team_id = user.team;
                            if(typeof sockets[user.id] != 'undefined') {
                                if(user.id != user_id){
                                    sockets[user.id].emit('lock', JSON.stringify({timestamp:now}));    
                                }   
                            }
                        }
                    }
                    console.log('team_id', team_id);
                    getTeamName().done(function(team_names){
                        var team_name = team_names[team_id];
                        broadcast(game_id, false, 'message', team_name + ' 有人被殺了！');
                        broadcastGameStatus(game_id).done(function(){
                            checkGameEnd();    
                        });
                    });
                });
            }
        });
        
        // killPlayer(game_id, user_id, number).done(
        // });
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
            var sql = "SELECT `id` FROM game WHERE `status`='idle' OR `status`='playing' ORDER BY `start_time` DESC LIMIT 1";
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
                var game_status = result[0].status;
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
                        game_status:game_status,
                        game_result: '',
                        packet_time: Math.floor((new Date()).getTime()/1000)
                    };

                    // TODO: count game_result
                    if(status.game_status == 'end') {

                    }

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

    var doKillPlayer = function(game_id, user_id, number, cb) {
        var callback = cb;
        KillQueue.push({
            game_id: game_id,
            user_id: user_id,
            number: number,
            callback: cb
        });
    };

    var killPlayer = function(game_id, user_id, number) {
        return new Promise(function(resolve) {
            // check the killer is alive
            var sql = "SELECT `id` FROM user WHERE `id`=? AND `status`='play'";

            db.query(sql, [user_id], function(err, result){
                if(err) {
                    console.log(err);
                }
                if(result.length === 0) {
                    // same as kill a dead user
                    resolve({
                        result: 'invalid'
                    });
                    return;
                }

                sql = "SELECT `id`,`status`,`team` FROM user WHERE `game_id`=? AND `number`=?";
                var params = [game_id,number];
                db.query( sql, params, function(err, result) {
                    if (err) {
                       console.log(err);
                    }
                    console.log('DB result', result);
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

                                sql = "SELECT `id`,`team` FROM user WHERE `game_id`=? AND `team`=?";
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
        });
    };

    var broadcast = function(game_id, team_id, tag, data) {
        var raw_data = data;
        data = JSON.stringify({
            timestamp: Math.floor((new Date()).getTime()/1000),
            data: data,
        });
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
            // add to message history
            sql = "INSERT INTO `message_history` (`game_id`,`team_id`, `timestamp`, `message`) VALUES (?,?,?,?)";
            param = [game_id, team_id, Math.floor((new Date()).getTime()/1000), raw_data];
            db.query(sql, param, function(err, result){
                if(err){
                    console.log(err);
                }
            });
        });
    };

    var broadcastGameStatus = function(game_id) {
        return new Promise(function(resolve) {
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
                        resolve(true);
                    }
                });
                resolve(true);
            });
            resolve(true);
        });
    };

    router.get('/aaa', function(req,res,next){
        checkGameEnd();
        res.end();
    });

    var checkGameEnd = function(game_id, time_end, need_broadcast) {
        return new Promise(function(resolve) {
            if(typeof game_id == 'undefined') {
                game_id = false;
            }
            if(typeof time_end == 'undefined') {
                time_end = false;
            }

            if(typeof need_broadcast == 'undefined') {
                need_broadcast = true;
            }
            // check all playing games
            var sql = "SELECT `id` FROM game WHERE ";
            var param = [];
            if(game_id === false) {
                sql += "`status`='playing'";

            } else {
                sql += "`id`=?";
                param = [game_id];
            }
            db.query(sql, param, function(err, games){
                var i;
                console.log(games);
                var game_id;
                if(games.length > 0 ) {
                    for(i in games) {
                        game_id = games[i].id;
                        getGameStatusAsync(games[i].id).done(function(status){
                            var alive = status.alive;

                            // check if game end
                            var j;
                            var alive_count = 0
                            var check_arr = [];
                            for(j in alive) {
                                check_arr.push({
                                    team: j,
                                    count: alive[j]
                                });
                            };
                            check_arr.sort(function(a, b){ return parseInt(b.count) - parseInt(a.count)});
                            console.log(check_arr);
                            // check if only one team alive
                            
                            if(check_arr[0].count > 0 && 
                                (check_arr[1].count +check_arr[2].count+check_arr[3].count === 0)) {
                                

                                if(need_broadcast) {
                                    sql = "UPDATE game SET `status`='end' WHERE `id`=?";
                                    db.query(sql, [game_id], function(err, result){
                                        // broadcast game end
                                        getTeamName().done(function(team_names){
                                            var team_name = team_names[check_arr[0].team];
                                            var message = '勝利者是 '+team_name;
                                            
                                            broadcast(game_id, false, 'end', message);
                                                
                                            resolve(message);
                                        });
                                    });
                                } else {
                                    getTeamName().done(function(team_names){
                                        var team_name = team_names[check_arr[0].team];
                                        var message = '勝利者是 '+team_name;
                                        resolve(message);
                                    });
                                }
                                
                                
                            } else if(check_arr[0].count === 0){
                                console.log('check', '2');
                                if(need_broadcast) {
                                    sql = "UPDATE game SET `status`='end' WHERE `id`=?";
                                    db.query(sql, [game_id], function(err, result){
                                        // all player killed
                                        var message = '所有人都被殺了，此次遊戲無獲勝者！';
                                        if(need_broadcast) {
                                            broadcast(game_id, false, 'end', message);
                                        }
                                        resolve(message);
                                    });
                                } else {
                                    getTeamName().done(function(team_names){
                                        var team_name = team_names[check_arr[0].team];
                                        var message = '勝利者是 '+team_name;
                                        resolve(message);
                                    });

                                }

                            } else if(time_end === true){
                                if(need_broadcast) {
                                    sql = "UPDATE game SET `status`='end' WHERE `id`=?";
                                    db.query(sql, [game_id], function(err, result){
                                        getTeamName().done(function(team_names){
                                            var message = '由 ';
                                            for(j in check_arr) {
                                                if(check_arr[j].count == check_arr[0].count) {
                                                    message += team_names[check_arr[j].team] +', ';
                                                }
                                            }

                                            message = message.substr(0, message.length -2);
                                            message += ' 同時獲勝！';
                                            broadcast(game_id, false, 'end', message);
                                            
                                            resolve(message);
                                        });
                                    });
                                } else {
                                    getTeamName().done(function(team_names){
                                        var message = '由 ';
                                        for(j in check_arr) {
                                            if(check_arr[j].count == check_arr[0].count) {
                                                message += team_names[check_arr[j].team] +', ';
                                            }
                                        }

                                        message = message.substr(0, message.length -2);
                                        message += ' 同時獲勝！';
                                        resolve(message);
                                    });
                                }
                            } else {
                                console.log('check', '4');

                                resolve('');

                                // no need to send game status 
                                return ;   
                            }

                            broadcastGameStatus(game_id);
                            
                        });
                    }
                }
            });
        });
    };

    var getTeamName = function() {
        return new Promise(function(resolve) {
            var sql = "SELECT * FROM team ";
            db.query(sql, [], function(err, result){
                console.log('team result', result);
                if(err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                if(result.length == 0 ){
                    resolve(false);
                    return;

                }
                var ret = [];
                var i;
                for(i in result) {
                    ret.push(result[i].name);
                }
                resolve(ret);
            });
        });
    };

    var sendEnterGameData = function(res, game_id, team, user_order) {
        sql = "SELECT * FROM user WHERE `game_id`=? AND `team`=? AND `user_order`=?";
        db.query(sql, [game_id, team, user_order], function(err, result){
            if (err) {
               console.log(err);
               return;
            }
            if(result.length > 0) {
                var user = result[0];

                // also select game info
                sql = "SELECT `start_time`,`game_time`,`status` FROM game WHERE `id`=?";
                db.query(sql, [game_id], function(err, result){
                    if (err) {
                       console.log(err);
                       return;
                    }
                    if(result.length > 0) {
                        var game_status = result[0].status;
                        user.start_time = result[0].start_time;
                        user.game_time = result[0].game_time;

                        getGameStatusAsync(game_id).done(function(data){
                            user = _.extend(user, data);
                            sql = "select `timestamp`,`message` FROM message_history WHERE `game_id`=? ORDER BY `timestamp` ASC";
                            param = [game_id];
                            db.query(sql, param, function(err, result){
                                user.message = result;
                                console.log('game_status',game_status);
                                if(game_status == 'end') {
                                    checkGameEnd(game_id, true).done(function(message){
                                        console.log('enter message', message);
                                        user.game_result = message;
                                        res.json(user);        
                                    });
                                } else {
                                    checkGameEnd(game_id, false, false).done(function(message){
                                        console.log('enter message', message);
                                        if(game_status == 'end') {
                                            user.game_result = message;
                                        } else {
                                            user.game_result = '';
                                        }
                                        
                                        res.json(user);        
                                    });   
                                }
                            });
                        })
                        
                    } else {
                        res.send('{}');
                    }
                    broadcastGameStatus(game_id);
                });
            } else {
                res.send('{}');
            }

        });
    };

    // do kill every 0.05ms
    setInterval(function(){
        if(KillQueue.length === 0) {
            return;
        }

        if(KillQueueLock) {
            console.log('locking');
            return;
        }

        KillQueueLock = true;

        var target = KillQueue.shift();
        var game_id = target.game_id;
        var user_id = target.user_id;
        var number = target.number;

        killPlayer(game_id, user_id, number).done(function(result){
            KillQueueLock = false;
            target.callback(result);
        });
    }, 50);

    // check DB every 5 seconds
    setInterval(function(){
        // select games to be started
        var timestamp = Math.floor((new Date()).getTime()/1000)+5;
        var sql = "SELECT `id`,`start_time` FROM game WHERE `status`='idle' AND `start_time`<?";
        db.query(sql, [timestamp], function(err, result){
            if(err) {
                return;
            }
            if(result.length > 0) {
                var i, data, delay, game_id;
                for(i in result) {
                    data = result[i];
                    game_id = data['id'];
                    delay = parseInt(data['start_time']) - Math.floor((new Date()).getTime()/1000);
                    (function(db, game_id, delay){
                        setTimeout(function(){
                            broadcast(game_id, false, 'start', '');
                            sql = "UPDATE game SET `status`='playing' WHERE `id`=?";
                            db.query(sql, [game_id], function(err, result){
                                if(err) {
                                    console.log(err);
                                }

                                // update users status
                                // sql = "UPDATE user SET `status`='idle' WHERE `game_id`=?";
                                // db.query(sql, [game_id], function(err, result){
                                //     if(err) {
                                //         console.log(err);
                                //     }
                                // });
                            });
                        }, delay * 1000);
                    })(db, game_id, delay);
                }
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
                var i, t, gt, delay, game_id;
                for(i in result) {
                    game_id = result[i].id;
                    t = parseInt(result[i].start_time);
                    gt = t + 60 * parseInt(result[i].game_time);
                    if(gt <= timestamp+5) {
                        delay = gt - timestamp;
                        (function(db, game_id, delay){
                            setTimeout(function(){
                                sql = "UPDATE game SET `status`='end' WHERE `id`=?";
                                db.query(sql, [game_id], function(err, result){
                                    if(err) {
                                        console.log(err);
                                    }
                                    broadcastGameStatus(game_id).done(function(){
                                        checkGameEnd(game_id, true);    
                                    });

                                    // update users status
                                    // sql = "UPDATE user SET `status`='idle' WHERE `game_id`=?";
                                    // db.query(sql, [game_id], function(err, result){
                                    //     if(err) {
                                    //         console.log(err);
                                    //     }
                                    // });
                                });
                            }, delay * 1000);
                        })(db, game_id, delay);
                        params.push(result[i].id);
                        sql += '?,';    
                    }
                }
            }
        });

    }, 5000);

    return router;
};
