'use strict';

const { app, BrowserWindow } = require('electron');

// const {is} = require('electron-util');
// const debug = require('electron-debug');
// const windowStateKeeper = require('electron-window-state');
const path = require('path');
//const uuid = require('uuid');

// const Store = require('electron-store');
// const store = new Store();


//debug();


//app.setAppUserModelId('edu.tsu.DentalTA');

let mainWindow;
const createMainWindow = async () => {
	// let mainWindowState = windowStateKeeper({
	// 	defaultWidth: 1024,
	// 	defaultHeight: 768
	// });

	const win = new BrowserWindow({
		title: app.getName(),
		// x: mainWindowState.x,
		// y: mainWindowState.y,
		// width: mainWindowState.width,
		// height: mainWindowState.height,
		backgroundColor: '#002D62',
		transparent: false,
		show: false,
		// webPreferences: {
		// 	nodeIntegration: true,
		// 	defaultEncoding: 'UTF-8',
		// 	disableBlinkFeatures: 'Auxclick'
		// }
	});

	//mainWindowState.manage(win);

	win.on('closed', () => {
		mainWindow = undefined;
	});

	win.webContents.on('did-finish-load', () => {
		win.webContents.setZoomFactor(1);
	});

	win.once('ready-to-show', () => {
		win.show();
	});

	await win.loadFile(path.join(__dirname, 'index.html'));
	return win;
};

if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized())
			mainWindow.restore();
		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos)
		app.quit();
});

app.on('activate', () => {
	if (!mainWindow)
		mainWindow = createMainWindow();
});

(async () => {
	//prep_settings();

	await app.whenReady();
	//Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();
	//send app ready ipc?
});

function prep_settings() {
	let appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	//let uid = store.get('uuid', uuid());
	let uid = 1;
	let firstRun = store.get('settings.first_run', true);
	let devMode = store.get('settings.dev_mode', is.development);

	let settings = {
		"version": appVersion,
		"uuid": uid,
		"settings": {
			"first_run": firstRun,
			"dev_mode": devMode
		}
	};
	store.set(settings);
}