var db = require('../db.js');
var game_id = 51;
var number = 83117;
var sql = "UPDATE user SET `status`='idle' WHERE `game_id`=? AND `number`=?";
var params = [game_id,number];
setTimeout(function(){

    db.query( sql, params, function(err, result) {
        console.log(err);
        console.log(result);
    });    
}, 500);
