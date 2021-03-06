
$(document).ready(function () {
  var h = $(window).height();
  $('.row').not('#text-area').each(function () {
    h -= $(this).height() + 70;
  });
  h -= $('footer').height();
  $('#editor').css('height', h);

  $('#dia').click(function (e) {
		$('#select').removeClass('disabled')
    zdiakritizuj();
  });

	$('#copy').on('click', function(e) {
		e.preventDefault();
		myCodeMirror.setValue(getText());
	});

	$('#select').on('click', function(e) {
		e.preventDefault();
		selectText();
	});

  var options = {
    'enterMode': 'flat',
    mode: "null",
		lineWrapping: true,
		value: 'Vloz alebo napis text a stlac tlacidlo Zdiakritizuj! Na oznacene slova sa da kliknut a vybrat spravne doplnenie.'
  };
  myCodeMirror = CodeMirror.fromTextArea($('#editor').get(0), options);
});

function zdiakritizuj () {
    var val = myCodeMirror.getValue();
    $.ajax({
      type: 'POST',
      url: '/accent-line',
      data: { 'q': val },
      dataType: 'json',
      success: insertResult
    });

}

function insertResult(msg) {
	var html = [];
	var l = msg.length;
	for (var i = 0; i < l; i++) {
		var field = msg[i];
		if (typeof field === 'string') {
			html.push('<span>');
			html.push(field);
			html.push('</span>');
		} else if (field instanceof Array) {
			html.push('<span class="dropdown"><a id="word');
			html.push(i);
			html.push('" class="dropdown-toggle" data-toggle="dropdown">');
			html.push(field[0]);
			html.push('</a><ul class="dropdown-menu">');
			var fl = field.length;
			for (var j = 0; j < fl; j++) {
				html.push(
					'<li><a onclick="replace(' + i + ', \'' + field[j] + '\');">');
				html.push(field[j]);
				html.push('</a></li>')
			}
			html.push('</ul></span>');
		} else if (typeof field.notfound === 'string') {
			html.push('<span class="notfound">');
			html.push(field.notfound);
			html.push('</span>');
		}
	}
	$("#result").html(html.join(''));
}

function replace(id, word) {
	$.get('/use/' + word);
	$("#word" + id).text(word);
	return false;
}

function getText() {
	var text = [];
	$('#result').children().each(function(i, elem) {
		elem = $(elem);
		console.log(elem);
		if (elem.hasClass('dropdown')) {
			text.push(elem.children('a').text());
		} else {
			text.push(elem.text());
		}
	});
	return text.join('');
}

function selectText() {
    var doc = document;
    var text = doc.getElementById("result");

    if (doc.body.createTextRange) { // ms
        var range = doc.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (window.getSelection) { // moz, opera, webkit
        var selection = window.getSelection();
        var range = doc.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}