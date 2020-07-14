'use strict';

const {shell} = require('electron');

module.exports = (app, mainWindow, i18n) => {
	let menu = {
		label: i18n.t('menu.debug'),
		submenu: [
			{
				label: i18n.t('menu.debug-reload'),
				click() {
					app.relaunch();
					app.quit();
				},
				accelerator: 'CmdOrCtrl+Shift+R'
			},
			{
				label: i18n.t('menu.debug-devtools'),
				click() {
					mainWindow.getFocusedWindow().toggleDevTools()
				},
				accelerator: 'CmdOrCtrl+Shift+I'
			},
			{ type: 'separator' },
			{
				label: i18n.t('menu.debug-appdata'),
				click() {
					shell.openItem(app.getPath('userData'));
				}
			},
			{
				label: i18n.t('menu.debug-delappdata'),
				click() {
					shell.moveItemToTrash(app.getPath('userData'));
					app.relaunch();
					app.quit();
				}
			},
			{
				type: 'separator'
			},
			{
				label: i18n.t('menu.debug-delsettings'),
				click() {
					store.clear();
					app.relaunch();
					app.quit();
				}
			}
		]
	};

	return menu;
};
