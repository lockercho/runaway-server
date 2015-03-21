
$('#broadcast_message').on('click', function(event) {
    event.preventDefault();
    
    // get message 
    var params = {
        message: $('#message').val()
    };
    $.get('/api/games/current/broadcast',params, function(data) {
        
    });
});

$('#delete-game').on('click', function(event) {
    event.preventDefault();
    $(this).attr('game-id');
    // get message 
    $.post('/api/games/'+$(this).attr('game-id')+'/delete', function(data) {
        
    });
});


var $date;
$('#list-table').find('.start-date').each(function(index){
    $(this).html(new Date(parseInt($(this).html()) * 1000).toLocaleString());
});