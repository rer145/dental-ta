'use strict';
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');
window.Popper = require('popper.js');

const snackbar = require('snackbarjs');
const bmd = require('bootstrap-material-design');

const {ipcRenderer} = require('electron');
const {is} = require('electron-util');


const Store = require('electron-store');
const store = new Store();

const util = require('./js/util.js');

const appName = store.get("name");
const appVersion = store.get("version");

window.current_file = "";
window.is_dirty = false;


function init() {
	$("#app-name").html(appName);
	$("#app-version").html(appVersion);

	$("body").bootstrapMaterialDesign();

	util.show_screen('splash');
}

function new_case() {
	if (window.is_dirty) {
		//confirm
	} else {
		window.current_file = "untitled.dta";
		window.is_dirty = true;
		util.display_current_file();
		util.show_screen('scoring');
	}
}

function open_case() {
	window.current_file = "";
	window.is_dirty = false;

	util.display_current_file();
	console.log("scnacking..");
	$.snackbar({
		content: "This item has not yet been implemented.",
		timeout: 2000,
		htmlAllowed: true
	});
	console.log("done");
}

function save_case() {
	window.is_dirty = false;
}

$(document).ready(function() {
	$(".btn-new-case").on('click', function(e) {
		new_case();
	});
	$(".btn-load-case").on('click', function(e) {
		open_case();
	});
	$(".btn-save-case").on('click', function(e) {
		save_case();
	});


	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
