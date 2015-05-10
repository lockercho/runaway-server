var fs    = require('graceful-fs'),
    ini   = require('ini'),
    path  = require('path'),
    mysql = require('mysql');

var exec = require('child_process').exec;

// read config from ini file
var config_path = './config.ini';
if(fs.existsSync('./local.ini')) {
  config_path = './local.ini';
}

var config = ini.parse(fs.readFileSync(path.resolve( __dirname, config_path), 'utf-8'));

var db_config = {
    host : config.db.host,
    user : config.db.user,
    password : config.db.password
    // database : config.db.database
};

var connection;
var db_host = config.db.host;
var db_user = config.db.user;
var db_pass = config.db.password;
var db_name = config.db.database_prefix + process.env.PORT;
var sql_file = path.resolve(__dirname, './runaway.sql');

console.log(sql_file);


function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since the old one cannot be reused.
  connection.connect(function(err) {              // The server is either down
    if(err) {                              // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  
    // check for db existance
    connection.query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '"+db_name+"'", function(err, result){
      
      if(result.length === 0) {
        connection.query("CREATE DATABASE `"+db_name+"` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci", function(err, result){
          connection.changeUser({database : db_name}, function(err) {
            if (err) throw err;
          });
          var command = 'mysql -h '+db_host+' -u'+db_user+' -p'+db_pass+' '+db_name+' < '+sql_file;
          exec(command, function (error, stdout, stderr) {
            // output is in stdout
          });
        });
      } else {
        connection.changeUser({database : db_name}, function(err) {
          if (err) throw err;
        });
      }
    });
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();
module.exports = connection;