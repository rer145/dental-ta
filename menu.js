'use strict';

const { app, Menu } = require('electron');
const win = require('electron').BrowserWindow;
const {is} = require('electron-util');

const appName = app.getName();

const debugSubmenu = [
	//{ role: 'reload' },
	{
		label: 'Force Reload',
		click() {
			app.relaunch();
			app.quit();
		},
		accelerator: 'CmdOrCtrl+Shift+R'
	},
	{
		label: 'Developer Tools',
		click() {
			win.getFocusedWindow().toggleDevTools()
		},
		accelerator: 'CmdOrCtrl+Shift+I'
	}
];

const macosTemplate = [
	{
		label: appName,
		submenu: [
			{ role: 'services', submenu: [] },
			{ role: 'separator' },
			{ role: 'hide' },
			{ role: 'hideothers' },
			{ role: 'unhide' },
			{ role: 'separator' },
			{ role: 'quit' }
		]
	}
];

const otherTemplate = [
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'Splash',
				click() {
					win.getFocusedWindow().webContents.send('show-screen', 'splash');
				}
			},
			{
				label: 'Scoring',
				click() {
					win.getFocusedWindow().webContents.send('show-screen', 'scoring');
				}
			}
		]
	}
];

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate;
if (is.development) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	});
}

module.exports = Menu.buildFromTemplate(template);
