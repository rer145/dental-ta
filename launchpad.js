const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');

const {is} = require('electron-util');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store')
const store = new Store();

const menu = require('./menu');

function createWindow () {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768
	});

	const mainWindow = new BrowserWindow({
		title: app.getName(),
		width: mainWindowState.width,
		height: mainWindowState.height,
		x: mainWindowState.x,
		y: mainWindowState.y,
		webPreferences: {
			//preload: path.resolve('./preload.js'),
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});

	mainWindowState.manage(mainWindow);

	mainWindow.loadFile('index.html');

	if (store.get("settings.dev_mode"))
		mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
	Menu.setApplicationMenu(menu);
	createWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	});
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
});
