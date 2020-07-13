const shortid = require('shortid');
const path = require('path');

const Store = require('electron-store');
const store = new Store();

function prep_settings() {
	const pjson = require(path.join(__dirname, "package.json"));
	let appName = pjson.productName;
	let appVersion = pjson.version;
	let uid = store.get("uid", shortid.generate());

	store.set({
		"name": appName,
		"version": appVersion,
		"uid": uid,
		"settings": {
			"dev_mode": true,
			"numbering": store.get("settings.numbering", "universal"),
			"auto_page_teeth": true
		},
		"app": {

		}
	});
}

prep_settings();

require('./launchpad.js');
