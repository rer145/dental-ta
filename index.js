const {app, BrowserWindow, dialog, ipcMain} = require('electron');
const shortid = require('shortid');
const path = require('path');
const url = require('url');
const fs = require('fs');

const Store = require('electron-store');
const store = new Store();

const debug = require('electron-debug');
const {is} = require('electron-util');
const windowStateKeeper = require('electron-window-state');

const i18n = require(path.join(__dirname, 'i18next.config'));
const menu = require(path.join(__dirname, 'menu'));

debug();
app.setAppUserModelId('edu.msu.DentalTA');

let win;

function prep_settings() {
	const pjson = require(path.join(__dirname, "package.json"));
	let appName = pjson.productName;
	let appVersion = pjson.version;
	let uid = store.get("uid", shortid.generate());

	store.set({
		"name": appName,
		"version": appVersion,
		"uid": uid,
		"settings": {
			"first_run": store.get("settings.first_run", true),
			"dev_mode": store.get("settings.dev_mode", false),
			"numbering": store.get("settings.numbering", "universal"),
			"image_preference": store.get("settings.image_preference", "mfh"),
			"auto_page_teeth": store.get("settings.auto_page_teeth", true),
			"language": store.get("settings.language", "en-US")
		},
		"app": {
			"runtime_path": store.get("app.runtime_path")
		}
	});
}

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
			nodeIntegrationInWorker: true,
			enableRemoteModule: true
		}
	});

	mainWindowState.manage(win);

	win.loadFile(path.join(__dirname, "index.html"));

	if (store.get("settings.dev_mode"))
		win.webContents.openDevTools();
}

app.whenReady().then(() => {
	prep_settings();
	createWindow();


	global.i18n = i18n;
	menu.buildMenu(app, win, i18n);

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

ipcMain.on('pdf-export', event => {
	const pdfPath = dialog.showSaveDialogSync({
		properties: ['openfile'],
		title: i18n.t('dialog.save-pdf.title'),
		buttonLabel: i18n.t('dialog.save-pdf.button'),
		filters: [
			{ name: i18n.t('dialog.save-pdf.filter'), extensions: ['pdf'] }
		]
	});

	if (pdfPath != null && pdfPath.length > 0) {
		//const pdfWin = BrowserWindow.fromWebContents(event.sender);
		win.webContents.printToPDF({}).then(data => {
			fs.writeFile(pdfPath, data, err => {
				if (err) {
					return console.error(err.message);
				}
				win.webContents.send('pdf-export-complete', pdfPath);
			});
		})
		.catch(err => {
			console.error(err.message);
			win.webContents.send('pdf-export-error');
		});
	} else {
		win.webContents.send('pdf-export-error');
	}
});
