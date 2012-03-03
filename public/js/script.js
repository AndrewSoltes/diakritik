
$(document).ready(function () {
  set_dropdown_handlers();
  var h = $(window).height();
  $('.row').not('#text-area').each(function () {
    h -= $(this).height() + 70;
  });
  h -= $('footer').height();
  $('#editor').css('height', h);

  $('#dia').click(function (e) {
    zdiakritizuj();
  });
  var options = {
    'enterMode': 'flat',
    mode: "null"
  };
  myCodeMirror = CodeMirror.fromTextArea($('#editor').get(0), options);
});

function zdiakritizuj () {
  // $('.editable div>div').unwrap();
  // $('.editable div').each(function () {
  //   // console.log($(this).html());
  //   $.ajax({
  //     type: 'POST',
  //     url: '/accent-line',
  //     data: { 'q': $(this).html() },
  //     success: bind(handler, this)
  //   });
  // });
  // var v = $('.editable').html();
  // $('.editable').html('');
  // log(v);
  // $('.editable').html(v);
  // set_dropdown_handlers();

  var num_of_lines = myCodeMirror.lineCount();
  for (var i = 0; i < num_of_lines; i++) {
    var line = myCodeMirror.getLine(i);
    $.ajax({
      type: 'POST',
      url: '/accent-line',
      data: { 'q': line },
      dataType: 'json',
      success: handler_on_line(i, true)
    });
  }
}

function handler_on_line (line_num, do_set_popup) {
  return function (msg) {
    var out = '';
    var offset = 0;
    var to_make_popup = [];
    for (var i in msg) {
      if (typeof msg[i] === 'string') {
        out += msg[i];
        offset += msg[i].length;
      }
      else if (msg[i].length === 1) {
        out += msg[i][0];
        offset += msg[i][0].length;
      }
      else {
        out += msg[i][0];
        to_make_popup.push({
          from: {line: line_num, ch: offset},
          to: {line: line_num, ch: offset + msg[i][0].length},
          words: msg[i]
        });
        offset += msg[i][0].length;
      }
    }
    myCodeMirror.setLine(line_num, out);
    for (var i = 0; i < to_make_popup.length; i++) {
      var new_popup = to_make_popup[i];
      var classes = 'marked';
      for (var j = 0; j < new_popup.words.length; j++) {
        classes += ' ' + new_popup.words[j];
      }
      log(new_popup);
      myCodeMirror.markText(new_popup.from, new_popup.to, classes);
    }
    if (do_set_popup)
      set_popup();
  }
}

function set_popup () {
  $('.marked').mousedown(function () {
    var classes = $(this).attr('class').split(' ');
    var popup_menu_html = '';
    for (var i in classes) {
      if (classes[i] !== 'cm-undefined' && classes[i] !== 'marked') {
        popup_menu_html += '<li><a href="#">' + classes[i] + '</a></li>';
      }
    }
    $('#popup .dropdown-menu').html(popup_menu_html);
    setTimeout(show_popup_at_cursor, 120);
    set_dropdown_handlers();
  });
}

function show_popup_at_cursor () {
  var popup = $('#popup');
  var coords = myCodeMirror.cursorCoords(false);
  popup.css('top', coords.y);
  popup.css('left', coords.x);
  popup.addClass('open');
}

function set_dropdown_handlers () {
  $("body").bind("click", function (e) {
    $('.dropdown-toggle, .menu').parent().removeClass("open");
  });
  // $(".dropdown-toggle, .menu").click(function (e) {
  //   $(this).parent().toggleClass('open');
  //   return false;
  // });
  $(".dropdown-inline .dropdown-menu a").click(function () {
		var word = $(this).html();
		$.get('/use/' + word);
    change_word_under_cursor(word);
  });
}

function change_word_under_cursor (word) {
	console.log(word);
  var left = myCodeMirror.getCursor(true);
  var right = myCodeMirror.getCursor(true);
  var regexp = /^[a-zA-Záäčďéíľĺňóôŕšťúýž]$/;
  var line = myCodeMirror.getLine(left.line);

	while (right.ch < line.length && regexp.test(line[right.ch]))
   right.ch++;

	left['ch']--;
  while (left['ch'] > 0 && regexp.test(line[left['ch']]))
    left['ch']--;

	if (left.ch !== 0)
  	left.ch++;
  // var token = myCodeMirror.getTokenAt(coords);
  // log(token);
  myCodeMirror.replaceRange(word, left, right);
  set_popup();
  // myCodeMirror.replaceRange(word, {line: coords.line, ch:coords.ch});
}

function bind (fn, object) {
  return function () {
    return fn.apply(object, arguments);
  }
}
