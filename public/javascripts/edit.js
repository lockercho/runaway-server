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


  console.log($date, Math.floor($date.getTime()/1000));

  
  // get data
  var params = {
    mode: mode,
    start_time: Math.floor($date.getTime()/1000),
    game_time: $('#game-time').val()
  };

  // get user data
  var $user;
  var users = [];
  $('.user').each(function(index){
    $user = $(this);
    users.push({
        id: $user.attr('user_id'),
        order: $user.attr('order'),
        team: $user.attr('team'),
        number: $user.find('.input-field input').val()
    })
  });

  params.users = JSON.stringify(users);

  var url;
  if(mode == 'edit') {
    url = '/api/games/'+$("#edit-mode").attr('game-id');
  } else {
    url = '/api/games'
  }

  console.log(params);

  $.post(url, params, function(data, textStatus, xhr) {
    if(mode == 'edit') {
        if($.isNumeric(data)) {
            alert('更新成功');
            window.location = '/manage/'+$("#edit-mode").attr('game-id');
          } else {
            alert('更新失敗');
          }
    }else{
        if($.isNumeric(data)) {
            alert('新增遊戲成功，將重導至遊戲資訊頁');
            window.location = '/manage/'+data;
        } else {
            alert('新增遊戲失敗');
        }
    } 
  });
  

});