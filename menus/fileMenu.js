'use strict';

module.exports = (app, mainWindow, i18n) => {
	let menu = {
		label: i18n.t('menu.file'),
		submenu: [
			{
				label: i18n.t('menu.file-new'),
				click() {
					console.log('new case');
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
			}
		]
	};

	return menu;
};
