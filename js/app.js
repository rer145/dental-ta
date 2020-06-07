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

	window.appdb = JSON.parse(fs.readFileSync(path.join(__dirname, "data/db.json")).toString());
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
		// tooh has been unselected
		$("#Tooth" + id).removeClass('active');

		$("#tooth-scoring").hide();
		$("#analysis-card .alert").show();
	} else {
		// tooth is currently selected
		$("polygon").removeClass("active");
		$("path").removeClass("active");
		$("#Tooth" + id).addClass("active");

		let type = $("#tooth-chart-selection .btn-primary").data('chart');
		let key = $("#Tooth" + id).data('key');

		let tooth = find_tooth(type, key);
		let field = tooth.field[type];

		$("#tooth-name").html(tooth.name);
		$("#tooth-jawside").html(`${tooth.jaw} / ${tooth.side}`);
		$("#tooth-score-id").val(field);

		let analysis = find_tooth_analysis(field);
		$("#tooth-score").empty().append(`<option value="NA"></option>`);
		for (let i = 0; i < analysis.scores.length; i++) {
			$("#tooth-score").append(`<option value="${analysis.scores[i]}">${analysis.scores[i]}</option>`);
			//TODO: check if previously scored, and select value
		}

		let score = window.scores[field];
		if (score != "NA")
			$("#tooth-score").val(score);
		$("#tooth-scoring").show();

		$("#analysis-card .alert").hide();
	}
}

function find_tooth(type, key) {
	let numbering = store.get("settings.numbering");

	for (let i = 0; i < window.appdb.teeth.length; i++) {
		if (window.appdb.teeth[i].numbering[type] &&
			window.appdb.teeth[i].numbering[type][numbering] &&
			window.appdb.teeth[i].numbering[type][numbering]== key) {
				return window.appdb.teeth[i];
		}
	}
	return {};
}

function find_tooth_analysis(field) {
	for (let i = 0; i < window.appdb.analysis.length; i++) {
		if (window.appdb.analysis[i].field === field) {
			return window.appdb.analysis[i];
		}
	}
	return {};
}

function save_tooth_score(key, score) {
	window.scores[key] = score;
	window.is_dirty = true;
	util.display_current_file();

	console.log(window.scores);
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
	$("body").on('click', '.spots polygon', function(e) {
		e.preventDefault();
		select_tooth($(this).data('key'));
	});
	$("body").on('click', '.spots path', function(e) {
		e.preventDefault();
		select_tooth($(this).data('key'));
	});
	$("#tooth-score").on('change', function(e) {
		e.preventDefault();
		save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val());
	});
	// $("#log-score-btn").on('click', function(e) {
	// 	e.preventDefault();
	// 	save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val());
	// });


	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
