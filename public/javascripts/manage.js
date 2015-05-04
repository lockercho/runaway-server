
$('#broadcast_message').on('click', function(event) {
    event.preventDefault();
    
    // get message 
    var params = {
        message: $('#message').val()
    };
    $.get('/api/games/current/broadcast',params, function(data) {
        alert('發送成功');
        $('#message').val('');
    });
});

$('.delete-game').on('click', function(event) {
    event.preventDefault();
    $(this).attr('game-id');
    var boo = confirm("確定刪除遊戲？");
    if(boo) {
        // get message 
        $.post('/api/games/'+$(this).attr('game-id')+'/delete', function(data) {
            alert('刪除成功');
            window.location = '/manage/';
        });
    }  
});


var $date;
$('#list-table').find('.start-date').each(function(index){
    $(this).html(new Date(parseInt($(this).html()) * 1000).toLocaleString());
});