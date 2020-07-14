'use strict';

const {
	is,
	appMenu,
	aboutMenuItem,
	showAboutWindow,
	openUrlMenuItem,
	openNewGitHubIssue,
	debugInfo
} = require('electron-util');

module.exports = (app, mainWindow, i18n) => {
	let menu = {
		label: i18n.t('menu.help'),
		submenu: [
			openUrlMenuItem({
				label: i18n.t('menu.help-website'),
				url: 'http://www.psu.edu'
			}),
			openUrlMenuItem({
				label: i18n.t('menu.help-source'),
				url: 'https://github.com/rer145/dental-ta'
			}),
			{
				label: i18n.t('menu.help-issue'),
				click() {
					const body = `
						${i18n.t('menu.help-issue-text')}

						---

						${debugInfo()}`;

					openNewGitHubIssue({
						user: 'rer145',
						repo: 'dental-ta',
						body
					});
				}
			},
			{ type: 'separator' },
			{
				label: i18n.t('menu.help-updates'),
				click() { }
				// click(menuItem, focusedWindow, event) {
				// 	updater.checkForUpdates(menuItem, focusedWindow, event);
				// }
			},
			{
				type: 'separator'
			}
		]
	};

	return menu;
};
