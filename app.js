/*
TODO:
make usage statistics work and be transparent to client

*/

var fs = require('fs');
var express = require('express');
var util = require('util');

var plainToAcc = {
	  'a': ['a', 'á', 'ä']
	, 'b': ['b']
	, 'c': ['c', 'č']
	, 'd': ['d', 'ď']
	, 'e': ['e', 'é']
	, 'f': ['f']
	, 'g': ['g']
	, 'h': ['h']
	, 'i': ['i', 'í']
	, 'j': ['j']
	, 'k': ['k']
	, 'l': ['l', 'ľ', 'ĺ']
	, 'm': ['m']
	, 'n': ['n', 'ň']
	, 'o': ['o', 'ó', 'ô']
	, 'p': ['p']
	, 'q': ['q']
	, 'r': ['r', 'ŕ']
	, 's': ['s', 'š']
	, 't': ['t', 'ť']
	, 'u': ['u', 'ú']
	, 'v': ['v']
	, 'w': ['w']
	, 'x': ['x']
	, 'y': ['y', 'ý']
	, 'z': ['z', 'ž']
};

//var accToPlain = getAccToPlain();

var prefixes = ['naj', 'ne'];

var accLetter = /[áäčďéíľĺňóôŕšťúýž]/;
var unAccLetter = /[a-zA-Z]/;

var trie = JSON.parse(fs.readFileSync('wordlist.json', 'utf8'));

var app = express.createServer();

app.configure(function (){
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser());
});

app.get('/use/:word', function (req, res) {

	res.send(JSON.stringify(words))
});

app.post('/accent-line', function (req, res) {
	res.send(JSON.stringify(parse(req.body.q)));
});

if (require.main === module) {
	app.listen(process.env.VMC_APP_PORT || 3000);
	console.log('running...');
}

// console.log(words['b']['e']['z']['p']['l']['a']['t']['n']['ý']['c']['h']);
// var test = "Mam tony textu, vsetko bez makcenov, dlznov a podobneho svinstva, neviete, ci existuje nejaka zalezitost, ktora by mi to tam pomohla pridat?";
// console.log(check_text(test));
// console.log(check('artroza'));

//function getAccToPlain() {
//	var atp = {};
//	for (var elem in plainToAcc) {
//		for (var i = 1; i < plainToAcc[elem].length; i++) {
//			atp[plainToAcc[elem][i]] = elem;
//		}
//	}
//	return atp;
//}

// output like ['some_text', ['accword', 'aččword'], 'another text' ]
// accented words sorted by usage desc
function parse(str) {
	var out = [];
	var justCopy = false;
	var inWord = false;
	var word = "";

	for (var idx = 0; idx < str.length; idx++) {
		if (str.charAt(idx).match(unAccLetter)) {
			if (inWord) {
				//inside word, just add characters to word
				word += str.charAt(idx);

			} else {
				//start of a word, push whitespace and stuff before word to ouput
				if (word.length > 0)
					out.push(word);
				inWord = true;
				word = str.charAt(idx); //start gathering characters of word
			}

		} else if (str.charAt(idx).match(accLetter)) {
			//if word has accented char in it, just copy it (don't look in dict.)
			justCopy = true;
			inWord = true; //if accented char is at start of word
			word += str.charAt(idx);

		} else {
			if (inWord) {
				// we're at first non-word char
				inWord = false;

				if (justCopy) {
					justCopy = false; //chars get "just copied" at the start of a next word
					word += str.charAt(idx);

				} else {
					//get words from dict
					pushAccentedWords(out, word);
					word = str.charAt(idx); //start gathering non-word characters
				}

			} else {
				word += str.charAt(idx);
			}
		}
	}
	//we got some chars left in word variable
	if (inWord && !justCopy) {
		//get words from dict
		pushAccentedWords(out, word);

	} else {
		out.push(word);
	}

	return out;
}

function pushAccentedWords(out, word) {
	var acw = accentWord(word);
	if (acw.length === 0) {
		//the word don't exist TODO spellcheck!
		out.push(word);

	} else if (acw.length === 1) {
		//just one way to accent this word, no need to push array
		out.push(acw[0]);

	} else {
		out.push(acw);
	}
}

function accentWord(word) {
	var accentedWords = [];
	var wordUsages = [];
	var capitalize = word.charAt(0).match(/[A-Z]/);
	var splitted = word.split('');
	splitted[0] = splitted[0].toLowerCase();
	word = word.toLowerCase();
	// for every prefix, try to strip it and look for stripped word
	var prefix;
	for (var i = 0; i < prefixes.length; i++) {
		prefix = prefixes[i];
		if (word.indexOf(prefix) === 0) {
			walk(trie, splitted.slice(prefix.length), []);
		}
	}
	prefix = null;
	walk(trie, splitted, []);

	return accentedWords;

	function walk(curr, unacc, acc) {
		if (unacc.length === 0) {
			//at the end of walk
			if (typeof curr['$'] !== 'undefined') {
				// word exists
				var accCopy = acc.slice(0); 		// keep acc intact
				if (prefix)
					accCopy = prefix.split('').concat(accCopy);		// add previously stripped prefix
				if (capitalize)
					accCopy[0] = accCopy[0].toUpperCase();	// capitalize previously uncapitalized

				// keep array *accentedWords* sorted by array *wordUsages* desc
				var usage = curr['$'];
				var k = 0;
				while (k < wordUsages.length && wordUsages[k] > usage) {
					k++;
				}
				//insert at right position to both, keeps wordUsages sorted
				wordUsages.splice(k, 0, usage);
				accentedWords.splice(k, 0, accCopy.join(''));
			}

		} else {
			var ch = unacc.shift();
			var accChars = plainToAcc[ch] || [];

			for (var j = 0; j < accChars.length; j++) {
				if (curr[accChars[j]]) {
					acc.push(accChars[j]);
					walk(curr[accChars[j]], unacc.slice(0), acc);
					acc.pop();
				}
			}
		}
	}
}


function prepend_to_every(prefix, result) {
	for (var i in result) {
		result[i].word = prefix + result[i].word;
	}
	return result;
}


function capitalize_every(result) {
	for (i in result)
		result[i]['word'] = result[i]['word'].charAt(0).toUpperCase() + result[i].word.substr(1);
}

function check(word) {
	if (typeof word !== 'string' || word == '')
		return '';
	var toupper = (word.charAt(0) === word.charAt(0).toUpperCase()) ? true : false;
	word = word.toLowerCase();
	var results = [];
	for (var i in prefixes) {
		var prefix = prefixes[i];
		if (word.indexOf(prefix) === 0) {
			var minus_prefix = word.substring(prefix.length);
			var minus_prefix_result = prepend_to_every(prefix, check(minus_prefix));
			results = results.concat(minus_prefix_result);
		}
	}
	word = word.split('');
	findwords(0, word, trie, '', results);
	if (toupper)
		capitalize_every(results);
	return results;
}

function remove_duplicates(results) {
	var len = results.length;
	for (var i = 0; i < len; i++) {
		if (i in results && (i+1) in results && results[i].word === results[i+1].word) {
			results.splice(i, 1);
			i--;
		}
	}
	return results;
}

function get_accented_words(word) {
	var results = check(word);
	if (results.length === 0)
		return [];
	else {
		var just_list = [];
		results.sort(function (a, b) {
			return a['$'] - b['$'];
		});
		results = remove_duplicates(results);
		for (var i in results) {
			just_list.push(results[i].word);
		}
		return just_list;
	}
}

function findwords(i, word, wordlist, goodword, result) {
	if (!word[i] || !plainToAcc[word[i]]) {
		if ('$' in wordlist) {
			result.push({ 'word': goodword, '$': wordlist['$'] });
			//console.log(wordlist);
		}
		return;
	}
	var word_alts = plainToAcc[word[i]];
	for (var j in word_alts) {
		if (word_alts[j] in wordlist)
			findwords(i+1, word, wordlist[word_alts[j]], goodword+word_alts[j], result);
	}
}

function accent_line(text) {
	var reg = /^[a-zA-Z]$/;
	var buff = '';
	var out = [];
	var len = text.length;
	for (var i = 0; i < len; i++) {
		if (reg.test(text[i])) {
			buff += text[i];

		} else {
			if (buff !== '') {	//output accented word in buff
				var accented_words = get_accented_words(buff);
				if (accented_words.length === 0)
					out.push(buff);
				else
					out.push(accented_words);
				buff = '';
			}

			out.push(text[i]);
		}
	}
	return out;
}
