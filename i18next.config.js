const path = require('path');
const i18n = require('i18next');
const i18nextBackend = require('i18next-fs-backend');

const i18nextOptions = {
	backend: {
		loadPath: path.join(__dirname, 'locales/{{lng}}.json'),
		addPath: path.join(__dirname, 'locales/{{lng}}.missing.json'),
		jsonIndent: 2
	},
	interpolation: {
		escapeValue: false
	},
	saveMissing: true,
	fallbackLng: 'en-US',
	whitelist: ['en-US', 'es'],
	react: {
		wait: false
	}
};

i18n.use(i18nextBackend);
if (!i18n.isInitialized) {
	i18n.init(i18nextOptions);
}

module.exports = i18n;
