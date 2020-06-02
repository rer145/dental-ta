'use strict';
window.$ = window.jQuery = require('jquery');
//window.Tether = require('tether');
window.Bootstrap = require('bootstrap');
window.Popper = require('popper.js');
//require('bootstrap-material-design');

const {ipcRenderer} = require('electron');
const {is} = require('electron-util');
const appName = "DAE";
const appVersion = "0.1.0";

function show_screen(id) {
	$(".screen").hide();
	$("header").removeClass("mb-auto").hide();
	$("footer").hide();

	let screen = $("#" + id + "-screen")
	if (screen.data('header')) $("header").show();
	if (screen.data('footer')) {
		$("footer").show();
		$("header").addClass("mb-auto");
	}


	screen.show();
}

function init() {
	$("#app-name").html(appName);
	$("#app-version").html(appVersion);

	show_screen('splash');
}

$(document).ready(function() {
	$(".btn-new-case").on('click', function(e) {
		console.log("new case");
	});
	$(".btn-load-case").on('click', function(e) {
		console.log("load case");
	});
	$(".btn-save-case").on('click', function(e) {
		console.log("save case");
	});


	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
