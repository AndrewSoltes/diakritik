var fs = require('fs');


// var wordlist = fs.readFileSync('sk_wordlist.txt', 'utf8');
// wordlist = wordlist.split('\n');

// for (i in wordlist) {
// 	//console.log(wordlist[i]);
// 	w = wordlist[i].split('');
// 	insert(w, out);
// }
// fs.writeFileSync("wordlist.json", JSON.stringify(out));

function insert(word, output) {
	if (!output[word[0]])
		output[word[0]] = {};
	var next = output[word[0]];
	word = word.slice(1);
	if (word.length === 0) {
		next["$"] = 0;
	} else {
		insert(word, next);
	}
}

function make_json(dic) {
	var out = {};
	for (var i in dic) {
		insert(dic[i], out);
	}
	return out;
}

function strip_empty(line) {
	var i = 0;
	var len = line.length;
	for (i = 0; i < len; i++) {
		if (i in line && line[i] === "") {
			line.splice(i, 1);
			i--;
		}
	}
	// console.log(line);
	return line;
}

function isInt(x) { 
	var y=parseInt(x); 
	if (isNaN(y)) return false; 
	return x==y && x.toString()==y.toString(); 
} 

function save_myspell_dic (dic_file, aff_file, output_file) {
	var out = '';
	var aff = fs.readFileSync(aff_file, 'utf8');
	aff = aff.split('\n');
	var dic = fs.readFileSync(dic_file, 'utf8');
	dic = dic.split('\n');

	var sfx = {};

	//strip whitespace and lines with less than 4 params
	for (var i in aff) {
		var a = strip_empty(aff[i].split(' '));
		if (a.length > 3) {
			aff[i] = a;
		}
	}
	//populate sfx file from aff textual representation
	for (var i in aff) {
		var line = aff[i];
		if (line[0] == 'SFX' && !isInt(line[3])) {
			if (!(line[1] in sfx)) {
				sfx[line[1]] = [];
			}
			sfx[line[1]].push({ 'strip': line[2], 'add': line[3], 'cond': new RegExp(line[4] + '$') });
		}
	}
	for (var i in dic) {
		line = dic[i].split('/');
		var word = line[0];
		out += word + '\n';
		if (line[1]) {
			var tags = line[1].split('');
			var naj = false;
			var ne = false;
			// for (var j in tags) {
			// 	if (tag === 'N') {	//prefix ne
			// 		out += 'ne' + word + '\n';
			// 		ne = true;
			// 	}
			// 	else if (tag === 'F') {	//prefix naj
			// 		out += 'naj' + word + '\n';
			// 		naj = true;
			// 	}
			// }
			for (var j in tags) {
				// console.log(tags[j]);
				var tag = tags[j];
				if (tag in sfx) {	//all suffixes in sfx[tag]
					for (var m in sfx[tag]) {
						suffix = sfx[tag][m]
						if (suffix.cond.test(word)) {
							var striplen = 0;
							if (suffix.strip !== '0')	// '0' means don't strip anything
								striplen = suffix.strip.length;
							var w = word.substring(0, word.length - striplen)
									+ sfx[tag][m].add + '\n';
							out += w;
							if (ne)
								out += 'ne' + w;
							if (naj)
								out += 'naj' + w;
						}
					}
				}
			}
		}
	}
	fs.writeFileSync(output_file, out);
}

save_myspell_dic('sk_SK.dic', 'sk_SK.aff', 'wordlist.dic');
var dic = fs.readFileSync('wordlist.dic', 'utf8');
dic = dic.split('\n');
var json_dic = make_json(dic);
fs.writeFileSync('wordlist.json', JSON.stringify(json_dic));