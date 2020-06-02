'use strict';

const fs = require('fs');
const path = require('path');

const current_file = "";
const is_dirty = false;

function new_file() {
	current_file = "untitled.txt";
	is_dirty = true;
}

function save_file(file_path, file_contents) {
	fs.writeFile(file_path, file_contents, function(err) {
		if (err) {
			console.error(err);
		}
		console.log("File saved");
	});
}


module.exports = {
	current_file,
	is_dirty,
	new_case,
	save_file
};
