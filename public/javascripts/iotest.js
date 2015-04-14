var printMsg = function(tag, msg) {
    var content = '<div>';
    content += '[' + ((new Date()).toLocaleString()) + '] ';
    content += '['+ tag +'] ';
    content += msg;
    content += '</div>';
    $('#container').prepend(content);
};


$('#get_game_info').on('click',function() {
    var params = {
        team: $('#team').val(),
        user_order: $('#user_order').val()
    };
    $.get('/api/games/current', function(game_id) {
        printMsg('Initialize', 'Current game_id = '+game_id);
        if(game_id != -1) {
            $.get('/api/games/'+game_id+'/enter', params,function(data) {
                printMsg('Initialize', data);
                // console.log('data',data);
                var user_id = data.id;

                var socket = io("http://localhost:3000?game_id="+game_id+"&user_id="+user_id); 
                socket.on("message", function(data){
                    printMsg('message', data);
                });

                socket.on("game_status", function(data){
                    printMsg('game_status', data);
                });

                socket.on("lock", function(data){
                    printMsg('lock', data);
                });

                socket.on("unlock", function(data){
                    printMsg('unlock', data);
                });

                socket.on("killed", function(data){
                    printMsg('killed', data);
                });

                socket.on("start", function(data){
                    printMsg('start', data);
                });

                socket.on("end", function(data){
                    printMsg('end', data);
                });


            });    
        } else {
            printMsg('Initialize', 'No current Game, Stop initializing');
        }
    });
});