'use strict';

const fs = require('fs');
const path = require('path');

function save_file(file_path, file_contents) {
	fs.writeFile(file_path, file_contents, function(err) {
		if (err) {
			console.error(err);
		}
		console.log("File saved");
	});
}


module.exports = {
	save_file
};
