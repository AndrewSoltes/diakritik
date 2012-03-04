var fs = require('fs');

var input = process.argv[2];
var output = process.argv[3];

if (!input || !output) {
	console.log('usage: node create_dict input output');
	process.exit();
}

var trie = {};

var lines = fs.readFileSync(input, 'utf8').split('\n');

for (var i = 0; i < lines.length; i++) {
	var word = lines[i].toLowerCase();
	var mark = trie;

	if (word.length > 0) {
		for (var j = 0; j < word.length; j++) {
			mark[word.charAt(j)] = mark[word.charAt(j)] || {};
			mark = mark[word.charAt(j)];
		}

		mark.$ = 0;
	}
}

fs.writeFile(output, JSON.stringify(trie), function (err) {
	if (err) throw err;
});
