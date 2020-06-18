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
		"M3": "NA"
		// , "Neander": false
		// , "Obs": 1
	};
}

function select_tooth(id) {
	if ($("#Tooth" + id).hasClass('active')) {
		// tooh has been unselected
		$("#Tooth" + id).removeClass('active');

		$("#tooth-scoring").hide();
		$("#analysis-card .alert").show();
		$("#help-card").hide();
		window.current_tooth = {};
		window.current_tooth_index - -1;
	} else {
		// tooth is currently selected
		$("polygon").removeClass("active");
		$("path").removeClass("active");
		$("#Tooth" + id).addClass("active");

		let type = $("#tooth-chart-selection .active").data('chart');
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

			let groups = [...new Set(scoring.map(item => item.group))];

			for (let i = 0; i < groups.length; i++) {
				let group_heading = $("<h5></h5>").html(util.title_case(groups[i]));
				$("#tooth-scoring-help").append(group_heading);

				let group_opt = $("<optgroup></optgroup").attr("label", util.title_case(groups[i]));

				let items = scoring.filter(function(item) {
					return item.group == groups[i];
				});

				for (let j = 0; j < items.length; j++) {
					group_opt.append(`<option value="${items[j].score}">${items[j].score} - ${items[j].text}</option>`);

					let html = `
						<div id="tooth-scoring-help-item-${items[j].score}" class="tooth-scoring-help-item card mb-3" data-tooth-id="${field}" data-tooth-score="${items[j].score}">
							<div class="row no-gutters">
								<div class="col-md-4 bg-white">
									<img src="${items[j].svg}" width="125" height="125" class="card-img" />
								</div>
								<div class="col-md-8">
									<div class="card-body">
										<h5 class="card-title">${items[j].display}</h5>
										<p class="card-text">
											${items[j].description}<br />
											Score: ${items[j].score}<br />
											<button type="button" class="btn btn-sm btn-primary btn-select-score stretched-link"data-tooth-id="${field}" data-tooth-score="${items[j].score}">Select</button>
										</p>
									</div>
								</div>
							</div>
						</div>
					`;

					$("#tooth-score").append(group_opt);
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
			$("#help-card").show();
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
	// only update score if higher than another tooth (per Kelly K.)
	if (window.scores[key] = "NA" || Number(score) > Number(window.scores[key])) {
		window.scores[key] = (score == "NA") ? "NA" : Number(score);

		if (isddl) {
			$(".tooth-scoring-help-item").removeClass("bg-primary");
			$(".tooth-scoring-help-item button").text("Select");
			$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
			$("#tooth-scoring-help-item-" + score + " button").text("Unselect");
		} else {
			$("#tooth-score").val(score);

			if ($("#tooth-scoring-help-item-" + score).hasClass("bg-primary")) {
				$("#tooth-scoring-help-item-" + score).removeClass("bg-primary");
				$("#tooth-scoring-help-item-" + score + " button").text("Select");
				$("#tooth-score").val("");
				score = "NA";
			} else {
				$(".tooth-scoring-help-item").removeClass("bg-primary");
				$(".tooth-scoring-help-item button").text("Select");
				$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
				$("#tooth-scoring-help-item-" + score + " button").text("Unselect");
			}
		}
	}

	window.is_dirty = true;
	util.display_current_file();

	console.log(window.scores);
}

function lookup_score(type, value) {
	let score = window.appdb.scoring[type].filter(function(item) {
		return Number(item.score) == Number(value);
	});
	if (score && score.length > 0)
		return score[0];
	return {};
}

function populate_review() {
	$("#scores-table tbody").empty();
	for (let k in window.scores) {
		if (window.scores.hasOwnProperty(k)) {
			if (window.scores[k] != "NA") {
				let tooth = window.appdb.teeth.filter(function(item) {
					return item.field.deciduous == k || item.field.permanent == k;
				});
				if (tooth && tooth.length > 0)
					tooth = tooth[0];

				let score = lookup_score(tooth.field.scoring, window.scores[k]);

				let row = $("<tr></tr>");
				let cell_tooth = $("<td></td>").html(`${k} - ${tooth.name}`);
				let cell_score = $("<td></td>").addClass("text-right").html(`${window.scores[k]} - ${score.display}`);

				row.append(cell_tooth).append(cell_score);
				$("#scores-table tbody").append(row);
			}
		}
	}
}

function run_analysis() {

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
	$(".case-button").on('click', function(e) {
		$("#tab-case-info").tab('show');
	});
	$(".review-button").on('click', function(e) {
		$("#tab-review-info").tab('show');
	});
	$(".analyze-button").on('click', function(e) {
		$("#tab-results-info").tab('show');
		run_analysis();
	});

	$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
		// e.target // newly activated tab
		// e.relatedTarget // previous active tab

		switch (e.target.id) {
			case "tab-scoring-info":
				break;
			case "tab-case-info":
				break;
			case "tab-review-info":
				populate_review();
				break;
			case "tab-results-info":
				break;
		}
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

	// $("body").on('click', '.btn-select-score', function(e) {
	// 	e.preventDefault();
	// 	save_tooth_score($(this).data("tooth-id"), $(this).data("tooth-score"), false);
	// });
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

	// $("#prev-tooth-button").on('click', function(e) {
	// 	e.preventDefault();
	// 	select_tooth($(this).data("index"));
	// });
	// $("#next-tooth-button").on('click', function(e) {
	// 	e.preventDefault();
	// 	select_tooth($(this).data("index"));
	// });

	init();
});




ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});
