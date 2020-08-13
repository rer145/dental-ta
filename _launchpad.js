const {app, BrowserWindow} = require('electron');
const path = require('path');

const {is} = require('electron-util');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store')
const store = new Store();

const i18n = require('./i18next.config');
const menu = require('./menu');

let win;

function createWindow () {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768
	});

	win = new BrowserWindow({
		title: app.getName(),
		width: mainWindowState.width,
		height: mainWindowState.height,
		x: mainWindowState.x,
		y: mainWindowState.y,
		icon: path.join(__dirname, "build/icon.png"),
		webPreferences: {
			//preload: path.resolve('./preload.js'),
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});

	mainWindowState.manage(win);

	win.loadFile('index.html');

	if (store.get("settings.dev_mode"))
		win.webContents.openDevTools();
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	});
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
});

i18n.on('loaded', (loaded) => {
	i18n.changeLanguage(app.getLocale());
	i18n.off('loaded');
});

i18n.on('languageChanged', (lng) => {
	global.i18n = i18n;
	menu.buildMenu(app, win, i18n);
	win.webContents.send('language-changed', lng);
});
