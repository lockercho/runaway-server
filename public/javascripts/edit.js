// init date-picker
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');

var mode = $('#edit-mode').attr('mode');
var game_id = $('#edit-mode').attr('game-id');
// set start time & date
if(mode == 'edit') {
    var $game_data = $("#game-data");
    $('#game-time').val($game_data.attr('game-time'));
    picker.set('select', parseInt($game_data.attr('start-time')) * 1000);


    var $date = new Date(parseInt($game_data.attr('start-time')) * 1000);
    var tokens = $date.toTimeString().split(':');
    $('#start-time').val(tokens[0]+':'+tokens[1]);
}


// on create
$('#save-change').on('click', function(e){
  e.preventDefault();
  e.stopPropagation();
  
  // get timestamp from start_date & start_time
  var date_obj = picker.get('select');
  var time_obj = $('#start-time').val().split(':');

  var $date = new Date();
  $date.setFullYear(date_obj.year);
  $date.setMonth(date_obj.month);
  $date.setDate(date_obj.date);
  $date.setHours(time_obj[0]);
  $date.setMinutes(time_obj[1]);
  $date.setSeconds(0);

  var start_time = Math.floor($date.getTime()/1000);
  console.log($date, start_time);

  var game_time = $('#game-time').val();
  if(!$.isNumeric(game_time)) {
    alert('遊戲時間應為數字');
    return;
  }

  if(parseInt(game_time) < 1) {
    alert('遊戲時間應大於 0');
    return;
  }

  if(start_time + parseInt(game_time) * 60 < Math.floor((new Date()).getTime()/1000) ) {
    alert('不可設定已結束的時間');
    return;
  }
  
  // get data
  var params = {
    mode: mode,
    start_time: Math.floor($date.getTime()/1000),
    game_time: game_time
  };

  // get user data
  var $user;
  var users = [];
  var numbers = [];
  var number_result = true;
  $('.user').each(function(index){
    $user = $(this);
    if($.inArray($user.find('.input-field input').val(), numbers) >= 0) {
      number_result = false;
      return;
    }
    numbers.push($user.find('.input-field input').val());
    users.push({
        id: $user.attr('user_id'),
        order: $user.attr('order'),
        team: $user.attr('team'),
        number: $user.find('.input-field input').val()
    })
  });

  if(!number_result) {
    alert('玩家編號不可重複');
    return;
  }


  params.users = JSON.stringify(users);

  var url;
  if(mode == 'edit') {
    url = '/api/games/'+$("#edit-mode").attr('game-id');
  } else {
    url = '/api/games';
  }

  console.log(params);

  $.post(url, params, function(data, textStatus, xhr) {
    if(mode == 'edit') {
        if($.isNumeric(data)) {
            alert('更新成功');
            window.location = '/manage/';
          } else {
            alert('更新失敗');
          }
    }else{
        if($.isNumeric(data)) {
            alert('新增遊戲成功');
            window.location = '/manage/';
        } else {
            alert('新增遊戲失敗');
        }
    } 
  });
});


// init broadcast
var updateBroadcastHistory = function() {
    // get message 
    $.getJSON('/api/games/'+game_id+'/broadcast', function(data) {

      data.sort(function(a,b){ return parseInt(b.timestamp) - parseInt(a.timestamp) });
      var content = '', i;
      for(i in data) {
        content += '<tr>';
        content += '<td class="date">';
        content += data[i].timestamp;
        content += '</td>';
        content += '<td>';
        content += data[i].message;
        content += '</td>';
        content += '</tr>';
      }
      
      $('#broadcast_history').find('tbody').html(content);

      $('#broadcast_history').find('.date').each(function(index){
        $(this).html(new Date(parseInt($(this).html()) * 1000).toLocaleString());
      });
    });
};

updateBroadcastHistory();

$('#broadcast_message').on('click', function(event) {
    event.preventDefault();
    
    // get message 
    var params = {
        message: $('#message').val()
    };
    $.post('/api/games/'+game_id+'/broadcast',params, function(data) {
        alert('發送成功');
        $('#message').val('');
        updateBroadcastHistory();
    });
});

$('#end_game').on('click', function(){
  var boo = confirm("確定要強制結束此次遊戲？");
  if(boo) {
    $.get('/api/games/'+game_id+'/force_end', [], function(flag) {
      if(flag == '1') {
        alert('操作成功');
        window.location = '/manage/';
      } else {
        alert('操作失敗');
      }
    });
  }
});

$('.force-die').on('click', function(){
  var number = $(this).parents('tr').find('.number').attr('number');
  var boo = confirm("確定要弄死玩家？");
  if(boo) {
    $.get('/api/games/'+game_id+'/kill', {user_id: 0, number: number}, function(flag){
      if(flag == 'success') {
        alert('更新成功');
        window.location = '/manage/'+game_id;
      } else {
        alert('更新失敗');
      }
    });
  }
});

$('.back-to-life').on('click', function(){
  var user_id = $(this).parents('tr').attr('user_id');
  var boo = confirm("確定要復活玩家？");
  if(boo) {
    $.get('/api/games/'+game_id+'/back_to_life', {user_id: user_id}, function(flag){
      if(flag == '1') {
        alert('更新成功');
        window.location = '/manage/'+game_id;
      } else {
        alert('更新失敗');
      }
    });
  }
});


