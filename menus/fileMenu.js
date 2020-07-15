'use strict';

module.exports = (app, mainWindow, i18n) => {
	let menu = {
		label: i18n.t('menu.file'),
		submenu: [
			{
				label: i18n.t('menu.file-new'),
				click() {
					mainWindow.webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: i18n.t('menu.file-open'),
				click() {
					mainWindow.webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			{
				label: i18n.t('menu.file-save'),
				click() {
					mainWindow.webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{ type: 'separator' },
			{
				label: i18n.t('menu.file-language'),
				submenu: [
					{
						label: 'English',
						type: 'radio',
						checked: i18n.language === 'en-US',
						click: () => {
							i18n.changeLanguage('en-US');
						}
					},
					{
						label: 'Spanish',
						type: 'radio',
						checked: i18n.language === 'es',
						click: () => {
							i18n.changeLanguage('es');
						}
					}
				]
			},
			{
				label: i18n.t('menu.file-settings'),
				click() {
					mainWindow.webContents.send('settings');
				},
				accelerator: 'CmdOrCtrl+P'
			},
			{ type: 'separator' },
			{
				label: i18n.t('menu.file-quit'),
				role: 'quit'
			}
		]
	};

	return menu;
};
