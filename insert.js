var db = require('./db.js');

var i,j;
var sql, params;

for(j=0; j<4 ; j++) {
    for(i=0;i<12;i++) {
    
        sql = "INSERT INTO user (`game_id`,`team`,`number`,`user_order`,`status`) VALUES (?,?,?,?,?)";
        params = [ 1, j, Math.floor(Math.random()*100000), i+1,'idle' ];

        db.query( sql, params, function(err, result) {
            if (err) {
               console.log(err);
            } else {
                console.log(result);    
            }
        });

    }
}