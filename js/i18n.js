const path = require('path');
const electron = require('electron');
const fs = require('fs');

let lang;
let app = electron.app ? electron.app : electron.remote.app;

module.exports = i18n;

function i18n() {
	if (fs.existsSync(path.join(app.getAppPath(), 'locales', app.getLocale() + '.js'))) {
		lang = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'locales', app.getLocale() + '.js'), 'utf8'));
	} else {
		lang = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'locales', 'en-US.js'), 'utf8'));
	}
	console.log("lang", lang);
	console.log("file", lang['menu-file-splash']);

}

i18n.prototype.__ = function(phrase) {
	let translation = lang[phrase];
	if (translation === undefined)
		translation = phrase;
	return translation;
}
