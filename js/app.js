'use strict';
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');
window.Popper = require('popper.js');

const Snackbar = require('node-snackbar');
const bmd = require('bootstrap-material-design');

const {ipcRenderer} = require('electron');
const {is} = require('electron-util');
const path = require('path');
const fs = require('fs');


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

	window.appdb = JSON.parse(fs.readFileSync(path.join(__dirname, "db.json")).toString());
	reset_scores();

	util.show_screen('splash');
}

function new_case() {
	if (window.is_dirty) {
		//confirm
	} else {
		window.current_file = "untitled.dta";
		window.is_dirty = true;
		reset_scores();

		util.display_current_file();
		util.show_screen('scoring');
	}
}

function open_case() {
	window.current_file = "";
	window.is_dirty = false;

	util.display_current_file();
}

function save_case() {
	window.is_dirty = false;
}

function reset_scores() {
	window.scores = {
		"dc": "NA",
		"dm1": "NA",
		"dm2": "NA",
		"UI1": "NA",
		"UI2": "NA",
		"LI1": "NA",
		"LI2": "NA",
		"C": "NA",
		"P3": "NA",
		"P4": "NA",
		"M1": "NA",
		"M2": "NA",
		"M3": "NA",
		"Neander": false,
		"Obs": 1
	};
}

function select_tooth(id) {
	if ($("#Tooth" + id).hasClass('active')) {
		$("#Tooth" + id).removeClass('active');
	} else {
		$("polygon").removeClass("active");
		$("#Tooth" + id).addClass("active");
	}
}

$(document).ready(function() {
	$(".btn-new-case").on('click', function(e) {
		e.preventDefault();
		new_case();
	});
	$(".btn-load-case").on('click', function(e) {
		e.preventDefault();
		open_case();
	});
	$(".btn-save-case").on('click', function(e) {
		e.preventDefault();
		save_case();
	});
	$(".btn-tooth-chart").on('click', function(e) {
		e.preventDefault();
		util.show_tooth_chart($(this), $(this).data('chart'));
	});

	$("body").on('click', 'text', function(e) {
		e.preventDefault();
		select_tooth($(this).html());
	});
	$("body").on('click', 'polygon', function(e) {
		e.preventDefault();
		select_tooth($(this).data('key'));
	});


	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
