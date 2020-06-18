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
window.current_tooth = {};
window.current_tooth_index = -1;


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
		window.current_tooth = {};
		window.current_tooth_index - -1;
	} else {
		// tooth is currently selected
		$("polygon").removeClass("active");
		$("path").removeClass("active");
		$("#Tooth" + id).addClass("active");

		let type = $("#tooth-chart-selection .btn-primary").data('chart');
		let key = $("#Tooth" + id).data('key');

		window.current_tooth_index = find_tooth_index(type, key);
		if (window.current_tooth_index > -1) {
			//let tooth = find_tooth(type, key);
			let tooth = window.appdb.teeth[window.current_tooth_index];
			let field = tooth.field[type];
			window.current_tooth = tooth;
			set_tooth_paging();

			$("#tooth-name").html(tooth.name);
			$("#tooth-jawside").html(`${tooth.jaw} / ${tooth.side == "R" ? "right" : "left"}`);
			$("#tooth-score-id").val(field);

			let scoring = window.appdb.scoring[tooth.field.scoring];
			$("#tooth-score").empty().append(`<option value="NA"></option>`);
			$("#tooth-scoring-help").empty();

			for (let i = 0; i < scoring.length; i++) {
				$("#tooth-score").append(`<option value="${scoring[i].score}">${scoring[i].score}</option>`);
				//TODO: check if previously scored, and select value
			}

			let groups = [...new Set(scoring.map(item => item.group))];
			for (let i = 0; i < groups.length; i++) {
				let group_heading = $("<h5></h5>").html(util.title_case(groups[i]));
				$("#tooth-scoring-help").append(group_heading);

				let items = scoring.filter(function(item) {
					return item.group == groups[i];
				});

				// let row = $("<ul></ul>").addClass("list-unstyled");
				// for (let j = 0; j < items.length; j++) {
				// 	let div = $("<li></li>").addClass("media my-4 position-relative");
				// 	let img = $("<img></img>").addClass("align-self-start mr-3 border")
				// 				.attr("src", items[j].svg)
				// 				.attr("width", 125)
				// 				.attr("height", 125);
				// 	let body = $("<div></div>").addClass("media-body");
				// 	let heading = $("<h5></h5>").addClass("mt-0 mb-1").html(items[j].display);
				// 	let text = `<br />${items[j].description}<br />Score: ${items[j].score}<br />`;
				// 	let link = $("<a></a>")
				// 				.addClass("btn-select-score stretched-link")
				// 				.attr("href", "#")
				// 				.html("Select");

				// 	row.append(
				// 		//col.append(
				// 			div.append(img).append(body.append(heading).append(text).append(link))
				// 		//)
				// 	)
				// }

				for (let j = 0; j < items.length; j++) {
					let html = `
						<div id="tooth-scoring-help-item-${items[j].score}" class="tooth-scoring-help-item card mb-3" data-tooth-id="${field}" data-tooth-score="${items[j].score}">
							<div class="row no-gutters">
								<div class="col-md-4">
									<img src="${items[j].svg}" width="125" height="125" class="card-img" />
								</div>
								<div class="col-md-8">
									<div class="card-body">
										<h5 class="card-title">${items[j].display}</h5>
										<p class="card-text">
											${items[j].description}<br />
											Score: ${items[j].score}<br />
											<a href="#" class="btn btn-sm btn-primary btn-select-score stretched-link"data-tooth-id="${field}" data-tooth-score="${items[j].score}">Select</a>
										</p>
									</div>
								</div>
							</div>
						</div>
					`;

					$("#tooth-scoring-help").append(html);
				}

				//$("#tooth-scoring-help").append(row);
			}

			// $("#tooth-scoring-help").empty().append(
			// 	$("#molar-scoring-help div").clone()
			// )

			let score = window.scores[field];
			if (score != "NA") {
				$("#tooth-score").val(score);
				$(".tooth-scoring-help-item").removeClass("bg-primary");
				$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
			}
			$("#tooth-scoring").show();

			$("#analysis-card .alert").hide();
		}
	}
}

function set_tooth_paging() {
	$("#prev-tooth-button").removeClass("disabled").data("index", window.current_tooth_index-1);
	$("#next-tooth-button").removeClass("disabled").data("index", window.current_tooth_index-1);

	if (window.current_tooth_index == 0) {
		$("#prev-tooth-button").addClass("disabled");
	}
	if (window.current_tooth_index == window.appdb.teeth.length-1) {
		$("#next-tooth-button").addClass("disabled");
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

function find_tooth_index(type, key) {
	let numbering = store.get("settings.numbering");

	for (let i = 0; i < window.appdb.teeth.length; i++) {
		if (window.appdb.teeth[i].numbering[type] &&
			window.appdb.teeth[i].numbering[type][numbering] &&
			window.appdb.teeth[i].numbering[type][numbering]== key) {
				return i;
		}
	}
	return -1;
}

function save_tooth_score(key, score, isddl) {
	if (isddl) {
		$(".tooth-scoring-help-item").removeClass("bg-primary");
		$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
		//$("#tooth-scoring-help-item-" + score + " a").html("Unselect");
	} else {
		$("#tooth-score").val(score);
		$(".tooth-scoring-help-item").removeClass("bg-primary");
		$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
	}

	if (window.scores[key] = "NA" || Number(score) > Number(window.scores[key]))
		window.scores[key] = Number(score);
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
		util.show_tooth_chart($(this), $(this).data('chart'), $(this).data('jaw'));
	});

	$("body").on('click', 'text[data-disabled="false"]', function(e) {
		e.preventDefault();
		select_tooth($(this).html());
	});
	$("body").on('click', '.spots polygon[data-disabled="false"]', function(e) {
		e.preventDefault();
		select_tooth($(this).data('key'));
	});
	$("body").on('click', '.spots path[data-disabled="false"]', function(e) {
		e.preventDefault();
		select_tooth($(this).data('key'));
	});

	$("body").on('click', '.btn-select-score', function(e) {
		e.preventDefault();
		save_tooth_score($(this).data("tooth-id"), $(this).data("tooth-score"), false);
	});
	$("body").on('click', '.tooth-scoring-help-item', function(e) {
		e.preventDefault();
		save_tooth_score($(this).data("tooth-id"), $(this).data("tooth-score"), false);
	});
	$("#tooth-score").on('change', function(e) {
		e.preventDefault();
		save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val(), true);
	});
	// $("#log-score-btn").on('click', function(e) {
	// 	e.preventDefault();
	// 	save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val());
	// });

	// $("body").on('mouseenter', '.scoring-help-item .card', function(e) {
	// 	$(this).addClass("bg-primary");
	// 	console.log("in");
	// });
	// $("body").on('mouseleave', '.scoring-help-item .card', function(e) {
	// 	$(this).removeClass("bg-primary");
	// 	console.log("out");
	// });

	// $(".scoring-help-item .card").hover(
	// 	function() {
	// 		$(this).addClass("bg-primary");
	// 	},
	// 	function() {
	// 		$(this).removeClass("bg-primary");
	// 	}
	// );

	$("#prev-tooth-button").on('click', function(e) {
		e.preventDefault();
		select_tooth($(this).data("index"));
	});
	$("#next-tooth-button").on('click', function(e) {
		e.preventDefault();
		select_tooth($(this).data("index"));
	});

	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
