'use strict';

const Menu = require('electron').Menu;
const {is} = require('electron-util');

const macMenu = require('./menus/macMenu');
const winMenu = require('./menus/windowsMenu');

const menu = null;

function MenuFactory(menu) {
	this.menu = menu;
	this.buildMenu = buildMenu;
}

function buildMenu(app, mainWindow, i18n) {
	if (is.macos) {
		this.menu = Menu.buildFromTemplate(macMenu(app, mainWindow, i18n));
		Menu.setApplicationMenu(this.menu);
	} else {
		this.menu = Menu.buildFromTemplate(winMenu(app, mainWindow, i18n));
		mainWindow.setMenu(this.menu);
	}
}

module.exports = new MenuFactory(menu);
