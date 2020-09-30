'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function make_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			console.error("Unable to create directory: " + err);
		}
	}
}

function empty_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			let files = fs.readdirSync(dir);
			for (var file in files) {
				fs.unlinkSync(path.join(dir, file));
			}
		} catch (err) {
			console.error("Unable to empty directory: " + err);
		}
	}
}

function copy_file(src, dest, replace) {
	var do_replace = replace;
	if (!replace) {
		do_replace = !fs.existsSync(dest);
	}

	if (do_replace) {
		fs.copyFile(src, dest, (err) => {
			if (err) {
                console.error("Unable to copy " + src + " to " + dest);
				console.error(err);
			}
		});
	}
}

function save_file(file_path, file_contents) {
	fs.writeFile(file_path, file_contents, function(err) {
		if (err) {
			console.error(err);
		}
		console.log("File saved");
	});
}

function unzip_file(zip_file, dest) {
	try {
		let z = new AdmZip(zip_file);
		z.extractAllTo(dest);
	} catch (err) {
		console.error("Unable to unzip file: " + err);
	}
}


module.exports = {
	make_directory,
	empty_directory,
	copy_file,
	save_file,
	unzip_file
};
