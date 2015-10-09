var printMsg = function(tag, msg) {
    var content = '<div>';
    content += '[' + ((new Date()).toLocaleString()) + '] ';
    content += '['+ tag +'] ';
    content += msg;
    content += '</div>';
    $('#container').prepend(content);
};

// kill test case
var Player = function(game_id, team, user_order) {
    this.game_id = game_id;
    this.team = team;
    this.user_order = user_order;
    this.user_id = false;
    this.data = false;

    var self = this;

    var params = {
        team: team,
        user_order: user_order
    };

    // init 
    $.get('/api/games/'+game_id+'/enter', params,function(data) {
        printMsg('Initialize', data);
        console.log('data',data);
    
        self.data = data;
        var user_id = data.id;
        self.user_id = user_id;

        var socket = io("http://localhost:8888?game_id="+game_id+"&user_id="+user_id); 
        socket.on("message", function(data){
            self.printMsg('message', data);
        });

        socket.on("game_status", function(data){
            self.printMsg('game_status', data);
        });

        socket.on("lock", function(data){
            self.printMsg('lock', data);
        });

        socket.on("unlock", function(data){
            self.printMsg('unlock', data);
        });

        socket.on("killed", function(data){
            self.printMsg('killed', data);
        });

        socket.on("start", function(data){
            self.printMsg('start', data);
        });

        socket.on("end", function(data){
            self.printMsg('end', data);
        });
    });    
};

Player.prototype.kill = function(number) {
    var self = this;
    var params = {
        user_id: self.user_id,
        number: number
    };
    $.get('/api/games/'+self.game_id+'/kill', params, function(data){
        self.printMsg('kill result', data);
    });
};

Player.prototype.printMsg = function(tag, msg) {
    var content = '<div>';
    content += '['+this.team+', '+this.user_order+']';
    content += '[' + ((new Date()).toLocaleString()) + '] ';
    content += '['+ tag +'] ';
    content += msg;
    content += '</div>';
    $('#container').prepend(content);
};

var player1;
var player2;

// get current game
$.get('/api/games/current', function(game_id) {
    printMsg('Initialize', 'Current game_id = '+game_id);

    if(game_id == -1) {
        printMsg('Initialize', 'No current Game, Stop initializing');
        return;
    }

    player1 = new Player(game_id, 1, 1);
    player2 = new Player(game_id, 2, 1);

    

});

$('#kill').on('click', function(){
    player1.kill(player2.data.number);
    player2.kill(player1.data.number);
});

