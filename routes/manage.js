var express = require('express');
var router = express.Router();
var db = require('../db.js');

/* GET manage list page. */
router.get('/', function(req, res, next) {
  var timestamp = Math.floor((new Date()).getTime()/1000) - 24 * 60 * 60;
  var sql = "SELECT * FROM game WHERE `start_time` > ? ORDER BY `start_time` DESC";
  var params = [timestamp];
  db.query( sql, params, function(err, result) {
      if (err) {
         console.log(err);
      }
      console.log(result);
      res.render('manage',{title:'Manage page', data:result});
  });
});

router.get('/iotest', function(req, res, next) {
  res.render('iotest',{title: 'io test'});
});
router.get('/killtest', function(req, res, next) {
  res.render('killtest',{title: 'kill test', host: process.env.HOST, port: process.env.PORT});
});


/* Create a new game */
router.get('/new', function(req, res, next) {
  // use the latest numbers for new game
  var sql = "SELECT * FROM user WHERE `game_id`=(SELECT MAX(`game_id`) FROM user) ORDER BY `user_order` ASC";
  db.query(sql, [], function(err, result){
    if(err) {
      console.log(err);
    }
    console.log(result);
    var data = processUsers(result);
    res.render('game',{title:'告密中 - 創建遊戲', game_data:{start_time:0, game_time:0}, game_id: 0, mode: 'create', data:data});
  });

});

/* Get game manage page */
router.get('/:game_id', function(req, res, next) {
  // get game data
  var sql = "SELECT * FROM game WHERE `id`=?";
  var params = [req.param('game_id')];

  db.query( sql, params, function(err, game_data) {
    if(game_data.length > 0 ){
      game_data = game_data[0];
      sql = "SELECT * FROM user WHERE `game_id`=? ORDER BY `user_order` ASC";
      db.query( sql, params, function(err, result) {
        if (err) {
           console.log(err);
        }
        var data = processUsers(result);
        console.log(data);
        res.render('game',{title:'告密中 - 編輯遊戲', game_data:game_data, game_id: req.param('game_id'), mode:'edit', data:data});
      });
    } else {
      res.end('<h3>No such game.</h3>');
    }
  });
  
});

/* Get game manage page */
router.get('/:game_id/data', function(req, res, next) {
  var sql = "SELECT * FROM user WHERE `game_id`=?";
  var params = [req.params.game_id];
  db.query( sql, params, function(err, result) {
      if (err) {
         console.log(err);
      }
      var data = processUsers(result);
      res.json(data);
  });
});

var processUsers = function(db_data){
  var i, t;
  var order_list = [];
  var data = [];
  for(i in db_data) {
    t = db_data[i].team;
    if(typeof order_list[t] == 'undefined') {
      order_list[t] = 1;
    }
    db_data[i].order = order_list[t];
    db_data[i].qr_content = JSON.stringify({
      url: 'http://'+process.env.server_url+':'+process.env.port,
      team: t,
      user_order: db_data[i].order
    });
    order_list[t]++;
    if(typeof data[t] == 'undefined') {
      data[t] = {
        team: t,
        team_name: t == '0' ? 'A': t == '1' ? 'B' : t == '2' ? 'C' : 'D',
        users: []
      };
    }

    data[t].users.push(db_data[i]);
  }
  return data;

};





module.exports = router;
