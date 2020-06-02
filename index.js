const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')

const menu = require('./menu');

function createWindow () {
	const mainWindow = new BrowserWindow({
		width: 1024,
		height: 768,
		webPreferences: {
			//preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true
		}
	});

	mainWindow.loadFile('index.html')
	
	mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
	Menu.setApplicationMenu(menu);
	createWindow()

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})
