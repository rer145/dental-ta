'use strict';

const {is} = require('electron-util');
const path = require('path');

const fileMenu = require('./fileMenu');
const helpMenu = require('./helpMenu');
const debugMenu = require('./debugMenu');


const pjson = require('../package.json');
let appName = pjson.productName;
let appVersion = pjson.version;

module.exports = (app, mainWindow, i18n) => {
	let menu = [
		{
			label: `${appName} (v${appVersion})`,
			submenu: [
				{ role: 'about' },
				{ role: 'separator' },
				{ role: 'hide' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ role: 'separator' },
				{
					label: i18n.t('menu.mac-quit'),
					accelerator: 'Command+Q',
					click: () => {
						app.quit();
					}
				}
			]
		}
	];

	menu.push(fileMenu(app, mainWindow, i18n));
	menu.push(helpMenu(app, mainWindow, i18n));

	if (is.development) {
		menu.push(debugMenu(app, mainWindow, i18n));
	}

	return menu;
};
