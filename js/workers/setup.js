const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');


let source_root = "";
let destination_root = "";
let platform = "";


onmessage = function(e) {
	if (e.data.length === 3) {
		source_root = e.data[0];
		destination_root = e.data[1];
		platform = e.data[2];
	}

	if (
		source_root.length > 0 &&
		destination_root.length > 0 &&
		platform.length > 0
	) {
		let setup_result = run_setup();
		postMessage(setup_result);
	} else {
		postMessage([false, "One or more required setup parameters is missing."]);
	}
}

function run_setup() {
	let output = "";
	let success = true;

	try {
		make_directory(path.join(destination_root, "r"));
		make_directory(path.join(destination_root, "packages"));
		make_directory(path.join(destination_root, "analysis"));
		make_directory(path.join(destination_root, "temp"));
	}
	catch (err) {
		output = `Error in making directories: ${err}`;
		success = false;
	}

	let r_portable = source_root;
	if (platform === "win32")
		r_portable = path.join(r_portable, "R-Portable-Win.zip");
	else
		r_portable = path.join(r_portable, "R-Portable-Mac.zip");

	let result_r = unzip_file(r_portable, path.join(destination_root, "r"));
	let result_a = unzip_file(path.join(source_root, "analysis.zip"), path.join(destination_root, "analysis"));

	if (result_r.length > 0 || result_a.length > 0) {
		success = false;
		output = `${output} ${result_r} ${result_a}`;
	}

	return [success, output];
}

function make_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			fs.mkdirSync(dir);
			return "";
		} catch (err) {
			//console.error("Unable to create directory: " + err);
			return `Unable to create directory (${dir}): ${err}`;
		}
	}
}

function unzip_file(zip_file, dest) {
	try {
		let z = new AdmZip(zip_file);
		z.extractAllTo(dest);
		return "";
	} catch (err) {
		//console.error("Unable to unzip file[" + zip_file + "]: " + err);
		return `Unable to unzip file (${zip_file}): ${err}`;
	}
}
