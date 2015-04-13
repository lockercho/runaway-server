// init date-picker
var $input = $('.datepicker').pickadate();
var picker = $input.pickadate('picker');

var mode = $('#edit-mode').attr('mode');
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
    if($.inArray($user.find('.input-field input').val(), numbers)) {
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