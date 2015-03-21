var db = require('../db');
var sql = "DROP DATABASE sandbox";
db.query(sql, function(err, result){
    if(err){
        console.log(sql);
        console.log(err);
    } 
    sql = "CREATE DATABASE sandbox";
    db.query(sql, function(err, result){
        if(err){
            console.log(sql);
            console.log(err);
        }
        sql = "USE sandbox";
        db.query(sql, function(err, result){
            if(err){
                console.log(sql);
                console.log(err);
            }
            sql = "source sandbox.sql";
            db.query(sql, function(err, result){
                if(err){
                    console.log(sql);
                    console.log(err);
                }
            });
        });
    });
})