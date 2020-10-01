'use strict';
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');
window.Popper = require('popper.js');

//const moment = require('moment');
const Snackbar = require('node-snackbar');
const bmd = require('bootstrap-material-design');
//const bmdtp = require('bootstrap-material-datetimepicker');

const {ipcRenderer} = require('electron');
const {dialog, getGlobal} = require('electron').remote;
const {is} = require('electron-util');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const Store = require('electron-store');
const store = new Store();

//const Chart = require('chart.js');

const locI18next = require('loc-i18next');
const { generate } = require('shortid');
//const { exec } = require('child_process');
const execa = require('execa');
const { param } = require('jquery');
const { parse } = require('path');
let i18n = getGlobal('i18n');

const appName = store.get("name");
const appVersion = store.get("version");

window.current_file = "";
window.is_dirty = false;
window.current_tooth = {};
window.current_tooth_index = -1;

// window.chartColors = {
// 	red: 'rgb(255, 99, 132)',
// 	orange: 'rgb(255, 159, 64)',
// 	yellow: 'rgb(255, 205, 86)',
// 	green: 'rgb(75, 192, 192)',
// 	blue: 'rgb(54, 162, 235)',
// 	purple: 'rgb(153, 102, 255)',
// 	grey: 'rgb(201, 203, 207)'
// };


function init() {
	$("#app-name").html(appName);
	$("#app-version").html(appVersion);

	$("body").bootstrapMaterialDesign();

	$("#tc-permanent-maxillary").load("images/charts/permanent-maxillary.svg");
	$("#tc-permanent-mandibular").load("images/charts/permanent-mandibular.svg");
	$("#tc-deciduous-maxillary").load("images/charts/deciduous-maxillary.svg");
	$("#tc-deciduous-mandibular").load("images/charts/deciduous-mandibular.svg");

	window.appdb = JSON.parse(fs.readFileSync(path.join(__dirname, "data/db.json")).toString());
	reset_scores();

	show_screen('splash');
}

function run_setup() {
	let folder = store.get("app.runtime_path", "");
	$("#setup-current-path").html(folder.length > 0 ? folder : "Not Set");
	if (folder.length > 0)
		enable_button("btn-setup-runtime");
	else
		disable_button("btn-setup-runtime");

	show_screen('setup');
}

function choose_runtime_path() {
	let folder = dialog.showOpenDialogSync({
		properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
		title: i18n.t('dialog.folder.title'),
		buttonLabel : i18n.t('dialog.folder.title'),
	});

	if (folder && folder.length == 1) {
		store.set("app.runtime_path", folder[0]);
		$("#setup-current-path").html(folder[0]);
		enable_button("btn-setup-runtime");
	} else {
		Snackbar.show({
			text: i18n.t('alerts.setup-no-folder'),
			pos: 'bottom-center',
			actionText: i18n.t('alerts.setup-choose-folder'),
			actionTextColor: '#ff0000',
			onActionClick: function(el) {
				$(el).css('opactity', 0);
				choose_runtime_path();
			}
		});
	}
}

function setup_runtime() {
	let src_root = path.join(__dirname, "runtime-files");
	if (!is.development)
		src_root = process.resourcesPath;

	let dest_root = store.get("app.runtime_path", "");

	if (dest_root.length === 0) {
		Snackbar.show({
			text: i18n.t('alerts.setup-no-folder'),
			pos: 'bottom-center',
			actionText: i18n.t('alerts.setup-choose-folder'),
			actionTextColor: '#ff0000',
			onActionClick: function(el) {
				$(el).css('opactity', 0);
				choose_runtime_path();
			}
		});
	} else {
		make_directory(path.join(dest_root, "r"));
		make_directory(path.join(dest_root, "packages"));
		make_directory(path.join(dest_root, "analysis"));
		make_directory(path.join(dest_root, "temp"));

		let r_portable = src_root;
		if (process.platform === "win32")
			r_portable = path.join(r_portable, "R-Portable-Win.zip");
		else
			r_portable = path.join(r_portable, "R-Portable-Mac.zip");

		unzip_file(r_portable, path.join(dest_root, "r"));
		// unzip_file(path.join(src_root, "packages.zip"), path.join(dest_root, "packages"));
		unzip_file(path.join(src_root, "analysis.zip"), path.join(dest_root, "analysis"));

		Snackbar.show({
			text: i18n.t('alerts.setup-complete'),
			pos: 'bottom-center',
			showAction: false,
		});
		store.set("settings.first_run", false);
		show_screen("splash");
	}
}

function new_case() {
	if (store.get("settings.first_run", true)) {
		run_setup();
	} else {
		if (window.is_dirty) {
			//confirm
		}

		window.current_file = "";
		window.is_dirty = true;
		reset_case_info();
		reset_scores();
		clear_tooth_selection();

		display_current_file();
		show_screen('scoring');
	}
}

function open_case() {
	if (store.get("settings.first_run", true)) {
		run_setup();
	} else {
		let files = dialog.showOpenDialogSync({
			properties: ['openfile'],
			title: i18n.t('dialog.open.title'),
			buttonLabel: i18n.t('dialog.open.button'),
			filters: [
				{ name: i18n.t('dialog.open.filter'), extensions: ['dta'] }
			]
		});

		if (files != undefined) {
			if (files.length == 1) {
				new_case();
				let filePath = files[0];
				fs.readFile(filePath, 'utf8', (err, data) => {
					if (err) {
						console.error(err);
					}
					let json = JSON.parse(data);

					// populate case info
					$("#case_number_input").val(json['properties']['case_number']);
					$("#observation_date_input").val(json['properties']['observation_date']);
					$("#analyst_input").val(json['properties']['analyst']);
					$("input").trigger('change');

					// populate window.scores
					window.scores = json['scores'];
					set_scored_teeth();

					// populate results (if applicable)

					window.current_file = filePath;
					window.is_dirty = false;
					display_current_file();
					show_screen('scoring');
				});
			}
		}
	}
}

function save_case() {
	let output = '{"scores":' + JSON.stringify(window.scores) + ',';
	output += '"properties":{"case_number":"' + $("#case_number_input").val() + '",';
	output += '"analyst":"' + $("#analyst_input").val() + '",';
	output += '"observation_date":"' + $("#observation_date_input").val() + '"}';
	output += '}';
	console.log(output);

	if (window.current_file == "") {
		window.current_file = dialog.showSaveDialogSync(null, {
			title: i18n.t('dialog.save.title'),
			buttonLabel: i18n.t('dialog.save.button'),
			filters: [
				{ name: i18n.t('dialog.save.filter'), extensions: ['dta'] }
			]
		});
	}

	if (window.current_file != undefined) {
		fs.writeFile(window.current_file, output, function(err) {
			if (err) {
				console.error(err);
			}
		});

		window.is_dirty = false;
		display_current_file();
	} else {
		window.current_file = "";
	}
}

function open_settings() {
	let settings = store.get("settings");
	$("#settings_numbering_" + settings['numbering']).attr('checked', 'checked');
	$("#settings_imgpref_" + settings['image_preference']).attr('checked', 'checked');
	$("#settings_autopage_" + String(settings['auto_page_teeth'])).attr('checked', 'checked');
	$("#settings-modal").modal('show');
}

function save_settings() {
	let autopage = true;
	if ($("input[name='settings_autopage']:checked").val() == "false")
		autopage = false;

	let settings = store.get("settings");
	settings['numbering'] = $("input[name='settings_numbering']:checked").val();
	settings['image_preference'] = $("input[name='settings_imgpref']:checked").val();
	settings['auto_page_teeth'] = autopage;
	store.set("settings", settings);

	//console.log(store.get("settings"));
	$("#settings-modal").modal('hide');
}

function reset_case_info() {
	$("#case_number_input").val("");
	$("#observation_date_input").val("");
	$("#analyst_input").val("");
}

function reset_scores() {
	window.scores = {};
	populate_review();
	set_scored_teeth();
}

function reset_score(id) {
	if (window.scores.hasOwnProperty("Tooth" + id)) {
		window.scores["Tooth" + id] = "NA";
	}
	populate_review();
	set_scored_teeth();
}

function prep_scores_for_analysis() {
	let output = {
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

	//loop through window.scores and get highest value for each
	for (let k in window.scores) {
		if (window.scores.hasOwnProperty(k)) {
			let tooth_idx = find_tooth_index(k.replace("Tooth", ""));
			if (tooth_idx > -1) {
				let tooth = window.appdb.teeth[tooth_idx];
				let current = output[tooth.field] == "NA" ? 0 : Number(output[tooth.field]);
				if (window.scores[k] != "NA") {
					if (Number(window.scores[k]) > Number(current)) {
						output[tooth.field] = window.scores[k];
					}
				}
			}
		}
	}

	//console.log(output);

	return output;
}

function set_scored_teeth() {
	$("polygon").removeClass("scored");
	$("path").removeClass("scored");
	for (let k in window.scores) {
		if (window.scores.hasOwnProperty(k)) {
			if (window.scores[k] != "NA") {
				if (!$("#" + k).hasClass("scored")) {
					$("#" + k).addClass("scored");
				}
			}
		}
	}
}

function clear_tooth_selection() {
	$("g.spots path").removeClass('active');
	$("g.spots polygon").removeClass('active');
	$("#tooth-scoring").hide();
	$("#analysis-card .alert").show();
	$("#help-card").hide();
	window.current_tooth = {};
	window.current_tooth_index - -1;
}

function select_tooth(id) {
	let tooth_key = "Tooth" + id;
	set_scored_teeth();

	if ($("#" + tooth_key).hasClass('active')) {
		// tooth has been unselected
		clear_tooth_selection();
	} else {
		// tooth is currently selected
		$("polygon").removeClass("active");
		$("path").removeClass("active");
		$("#Tooth" + id).removeClass("scored").addClass("active");

		let type = $("#tooth-chart-selection .active").data('chart');
		let key = $("#" + tooth_key).data('key');

		window.current_tooth_index = find_tooth_index(key);
		if (window.current_tooth_index > -1) {
			//let tooth = find_tooth(type, key);
			let img_preference = store.get("settings.image_preference");
			let tooth = window.appdb.teeth[window.current_tooth_index];
			//let field = tooth.field[type];
			window.current_tooth = tooth;
			set_tooth_paging();

			$("#tooth-name").html(tooth.name);
			$("#tooth-jawside").html(`${tooth.jaw} / ${tooth.side == "R" ? "right" : "left"}`);
			$("#tooth-score-id").val(tooth.id);

			let scoring = window.appdb.scoring[tooth.scoring];
			$("#tooth-score").empty().append(`<option value="NA"></option>`);
			$("#tooth-scoring-help").empty();

			let groups = [...new Set(scoring.map(item => item.group))];

			for (let i = 0; i < groups.length; i++) {
				let group_heading = $("<div></div>").addClass("col-12").append(
					$("<h5></h5>").addClass("pb-4").html(title_case(groups[i]))
				);
				$("#tooth-scoring-help").append(group_heading);

				let group_opt = $("<optgroup></optgroup").attr("label", title_case(groups[i]));

				let items = scoring.filter(function(item) {
					return item.group == groups[i];
				});

				for (let j = 0; j < items.length; j++) {
					group_opt.append(`<option value="${items[j].score}">${items[j].score} - ${items[j].text}</option>`);

					let html = `
						<div id="tooth-scoring-help-item-${items[j].score}" class="tooth-scoring-help-item card mb-3" data-tooth-id="${tooth.id}" data-tooth-score="${items[j].score}">
							<div class="row no-gutters">
								<div class="col-md-3 bg-white text-center">
									<img src="${items[j].image}" width="125" height="125" />
								</div>
								<div class="col-md-6">
									<div class="card-body">
										<h5 class="card-title">${items[j].display}</h5>
										<p class="card-text">
											${items[j].description}<br />
											Score: ${items[j].score}<br />
											<button type="button" class="btn btn-sm btn-primary btn-select-score stretched-link" data-tooth-id="${tooth.field}" data-tooth-score="${items[j].score}">Select</button>
										</p>
									</div>
								</div>
								<div class="col-md-3 bg-white text-center">
									<img src="${items[j].xray}" width="125" height="125" />
								</div>
							</div>
						</div>
					`;

					let score = find_tooth_score_by_score(tooth.scoring, items[j].score);
					let text = `<strong>${score.display}</strong> (value: ${score.score}): ${score.description}`;
					let img = img_preference == "mfh" ? items[j].image : items[j].xray;

					html = `
						<div class="col-sm-6 col-md-4 col-lg-3 mb-3">
							<div id="tooth-scoring-help-item-${items[j].score}" class="tooth-scoring-help-item" data-tooth-id="${tooth.id}" data-tooth-score="${items[j].score}" data-toggle="tooltip" data-html="true" title="${text}">
								<h6 class="d-block bg-secondary text-white p-2">${items[j].display}</h6>
								<img class="mx-auto d-block" src="${img}" width="75" height="75" />
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

			let has_score = false;
			let score = "NA";
			if (window.scores.hasOwnProperty(tooth_key)) {
				if (window.scores[tooth_key] != "NA") {
					has_score = true;
					score = window.scores[tooth_key];
				}
			}
			if (has_score && score != "NA") {
				$("#tooth-score").val(score);
				$(".tooth-scoring-help-item").removeClass("bg-primary");
				$("#tooth-scoring-help-item-" + score).addClass("bg-primary");
				$("#tooth-scoring-help-item-" + score + " button").html("Unselect");
			}
			$("#tooth-scoring").show();

			$("#analysis-card .alert").hide();
			$("#help-card").show();
		}
	}
}

function show_tooth_score_details(tooth_id, tooth_score) {
	let tooth = find_tooth(tooth_id);
	let score = find_tooth_score_by_score(tooth.scoring, tooth_score);

	if (tooth != undefined && score != undefined) {
		let text = `<strong>${score.display}</strong> (value: ${score.score}): ${score.description}`;
		$("#tooth-score-text").html(text);
	}
}

function hide_tooth_score_details() {
	$("#tooth-score-text").empty();
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

function find_tooth(key) {
	let numbering = store.get("settings.numbering");

	for (let i = 0; i < window.appdb.teeth.length; i++) {
		// if (window.appdb.teeth[i].numbering[type] &&
		// 	window.appdb.teeth[i].numbering[type][numbering] &&
		// 	window.appdb.teeth[i].numbering[type][numbering]== key) {
		// 		return window.appdb.teeth[i];
		// }
		if (window.appdb.teeth[i].id == key) {
			return window.appdb.teeth[i];
		}
	}
	return {};
}

function find_tooth_index(key) {
	let numbering = store.get("settings.numbering");

	for (let i = 0; i < window.appdb.teeth.length; i++) {
		// if (window.appdb.teeth[i].numbering[type] &&
		// 	window.appdb.teeth[i].numbering[type][numbering] &&
		// 	window.appdb.teeth[i].numbering[type][numbering]== key) {
		// 		return i;
		// }
		if (window.appdb.teeth[i].id == key) {
			return i;
		}
	}
	return -1;
}

function find_tooth_score_by_score(mode, score) {
	for (let i = 0; i < window.appdb.scoring[mode].length; i++) {
		if (window.appdb.scoring[mode][i].score == score) {
			return window.appdb.scoring[mode][i];
		}
	}
	return -1;
}

function find_tooth_score_index_by_score(mode, score) {
	for (let i = 0; i < window.appdb.scoring[mode].length; i++) {
		if (window.appdb.scoring[mode][i].score == score) {
			return i;
		}
	}
	return -1;
}

function save_tooth_score(key, score, isddl) {
	if (String(key).indexOf("Tooth") < 0)
		key = "Tooth" + key;
	// only update score if higher than another tooth (per Kelly K.)
	//if (window.scores[key] = "NA" || Number(score) > Number(window.scores[key])) {
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

		window.scores[key] = (score == "NA") ? "NA" : Number(score);
		set_scored_teeth();
	//}

	window.scrollTo(0, 0);
	window.is_dirty = true;
	display_current_file();

	console.log(window.scores);

	let auto_page = store.get("settings.auto_page_teeth", false);
	if (auto_page) {
		if (window.current_tooth.set === "permanent") {
			if (window.current_tooth.id+1 < 33) {
				// advance to next tooth
				let tooth = find_tooth(window.current_tooth.id+1);
				show_tooth_chart(null, tooth.set, tooth.jaw);
				select_tooth(tooth.id);
			} else {
				// back to permanent tooth 1 (or loop to deciduous?)
				show_tooth_chart(null, "permanent", "maxillary");
				select_tooth(1);
			}
		} else {
			let max_char = "T".charCodeAt(0);
			let next_char = window.current_tooth.id.charCodeAt(0)+1;
			if (window.current_tooth.id == 'C')
				next_char = 'H'.charCodeAt(0);
			if (window.current_tooth.id == 'M')
				next_char = 'R'.charCodeAt(0);

			if (next_char < max_char+1) {
				// advance to next tooth
				let tooth = find_tooth(String.fromCharCode(next_char));
				show_tooth_chart(null, tooth.set, tooth.jaw);
				select_tooth(tooth.id);
			} else {
				// back to deciduous tooth A (or loop to permanent?)
				show_tooth_chart(null, "deciduous", "maxillary");
				select_tooth("A");
			}
		}
	}
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
	let numbering = store.get('settings.numbering');
	if (numbering === 'universal')
		numbering = 'id';

	$("#scores-table tbody").empty();

	let review_scores = [];
	Object.keys(window.scores).forEach(function(key) {
		let id = key.replace("Tooth", "");
		if (window.scores.hasOwnProperty(key)) {
			if (window.scores[key] != "NA") {
				let tooth = window.appdb.teeth.filter(function(item) {
					return item.id == id;
				});
				if (tooth && tooth.length > 0)
					tooth = tooth[0];

				let score = lookup_score(tooth.scoring, window.scores[key]);

				review_scores.push({
					id: tooth.id,
					tooth: tooth,
					score: score,
					display: window.scores[key]
				});
			}
		}
	});

	review_scores.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));

	for (let i = 0; i < review_scores.length; i++) {
		let row = $("<tr></tr>");
		let cell_numbering = $("<td></td>").html(`${review_scores[i].tooth[numbering]}`);
		let cell_set = $("<td></td>").html(`${review_scores[i].tooth.set}`);
		let cell_jaw = $("<td></td>").html(`${review_scores[i].tooth.jaw}`);
		let cell_side = $("<td></td>").html(`${review_scores[i].tooth.side}`);
		let cell_tooth = $("<td></td>").html(`${review_scores[i].tooth.name}`);
		let cell_score = $("<td></td>").addClass("text-right").html(`${review_scores[i].score.display} (${review_scores[i].display})`);
		let cell_remove = $("<td></td>").html(`<a href="#" class="btn-clear-score text-danger" data-tooth-id="${review_scores[i].tooth.id}">${i18n.t("review.remove")}</a>`)

		row
			.append(cell_numbering)
			.append(cell_set)
			.append(cell_jaw)
			.append(cell_side)
			.append(cell_tooth)
			.append(cell_score)
			.append(cell_remove);
		$("#scores-table tbody").append(row);
	}

	prep_scores_for_analysis();
}

function generate_input_file(scores) {
	let cols = ['ID', 'dc', 'dm1', 'dm2', 'UI1', 'UI2', 'LI1', 'LI2', 'C', 'P3', 'P4', 'M1', 'M2', 'M3', 'Neander', 'Obs'];
	let primer = ['primer', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 'FALSE', 1]
	let vals = [];

	for (let i = 0; i < cols.length; i++) {
		if (scores.hasOwnProperty(cols[i])) {
			vals.push(scores[cols[i]]);
		} else {
			if (cols[i] == 'ID') {
				if ($("#case_number_input").val().length > 0)
					vals.push($("#case_number_input").val().replace(/[^a-zA-Z]/g, ""));
				else
					vals.push('CASE');
			}
			if (cols[i] == 'Neander')
				vals.push('FALSE');
			if (cols[i] == 'OBS')
				vals.push(1)
		}
	}

	let header = cols.join(",");
	let row = primer.join(",");
	let data = vals.join(",");

	// row = "primer,1,2,3,4,5,6,7,8,9,10,11,12,13,FALSE,1";
	//data = "UTHSCA_Case_29,16,15,15,10,NA,12,11,9,7,6,13,6,NA,FALSE,1";

	//.\Rscript.exe "D:\\temp\\dental\\analysis\\analysis.R" "D:\\temp\\dental" "D:\\temp\\dental\\temp\\no-primer.csv" "D:\\temp\\dental\\temp\\no-primer-output.txt" 1
	//.\Rscript.exe "D:\\temp\\dental\\analysis\\analysis.R" "D:\\temp\\dental" "D:\\temp\\dental\\temp\\primer.csv" "D:\\temp\\dental\\temp\\primer-output.txt" 2

	try {
		let filepath = path.join(store.get("app.runtime_path"), "temp", new Date().valueOf().toString() + "-input.csv");
		//fs.writeFileSync(filepath, header + '\n' + row + '\n' + data + '\n');
		fs.writeFileSync(filepath, header + '\n' + data + '\n');
		return filepath;
	} catch (err) {
		console.error(err);
		return "";
	}
}

function generate_output_file(input_file) {
	let ts = input_file.replace("-input.csv", "").replace(path.join(store.get("app.runtime_path"), "temp"), "");
	let filepath = path.join(store.get("app.runtime_path"), "temp", ts + "-output.txt");
	return filepath;
}

function clean_temp_files() {
	let temp_path = path.join(store.get("app.runtime_path"), "temp");
	let files = [
		path.join(temp_path, "output1.png"),
		path.join(temp_path, "output2.png")
	]

	for (var f in files)
	if (fs.existsSync(f)) {
		try {
			fs.unlinkSync(f);
		} catch (err) {
			console.error("Unable to delete", f);
		}
	}
}

function run_analysis() {
	clean_temp_files();
	$("#results-case-number").html($("#case_number_input").val());
	$("#results-observation-date").html($("#observation_date_input").val());
	$("#results-analyst").html($("#analyst_input").val());

	let scores = prep_scores_for_analysis();
	console.log(scores);

	let input_file = generate_input_file(scores);
	let output_file = generate_output_file(input_file);
	if (input_file.length > 0) {
		let options = {
			name: i18n.t("title")
		};

		let runtime_path = store.get("app.runtime_path");
		let r_path = path.join(runtime_path, "r", "bin", "Rscript.exe");
		let cmd = '"' + r_path + '"';
		let parameters = [
			path.join(runtime_path, "analysis", "analysis.R"),
			runtime_path,
			input_file,
			output_file,
			1
		];
		$.each(parameters, function(i,v) {
			//cmd = cmd + ' "' + v + '"';
			v = '"' + v + '"';
		});
		// console.log(cmd);
		// console.log(parameters);

		var has_error = false;
		try {
			execa.sync(cmd, parameters);
		} catch (err) {
			console.error(err);
			has_error = true;
		}

		try {
			let results = fs.readFileSync(output_file).toString();
			// if (has_error)
			// 	$("#debug-output").css("border-color", "#ff0000");

			$("#debug-output").empty().html(results);
			parse_output(results);
			$("#debug-images").empty();
			show_output_image(path.join(runtime_path, "temp", "output1.png"), $("#debug-images"));
			show_output_image(path.join(runtime_path, "temp", "output2.png"), $("#debug-images"));
		}
		catch (err) {
			console.error(err);
		}
	} else {
		Snackbar.show({
			text: i18n.t('alerts.analysis-no-input-file'),
			pos: 'bottom-center',
			showAction: false
		});
	}
}

function parse_output(text) {
	text = text.replace("Inf", "999");

	let json = JSON.parse(text);
	console.log(json);

	$("#results-mu").val(json.output.mean_corrected_age.toFixed(3));
	$("#results-w").val(json.output.within_variance.toFixed(3));
	$("#results-b").val(json.output.between_variance.toFixed(3));
	$("#results-prediction").html(`${json.output.known_age.toFixed(3)} year(s)`);
	$("#results-lower").html(json.output.known_age_lower.toFixed(3));
	$("#results-upper").html(json.output.known_age_upper.toFixed(3));
}

function show_output_image(filename, parent) {
	if (fs.existsSync(filename)) {
		var img = $("<img></img>");
		img.attr("src", "file://" + filename + "?rand=" + (Math.random() * 99999999))
			.addClass("img-fluid");
		parent.append(img);
	}
}

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

	if (id === 'scoring') {
		show_tooth_chart(
			$(".btn-tooth-chart").first(),
			$(".btn-tooth-chart").first().data('chart'),
			$(".btn-tooth-chart").first().data('jaw')
		);
		$("#tab-case-info").tab('show');
	}

	screen.show();
}

function show_tooth_chart(obj, id, jaw) {
	$(".btn-tooth-chart").removeClass("active");

	// if (obj != undefined && obj != null) {
	// 	obj.removeClass("btn-secondary").addClass("active");
	// } else {
	// 	obj = $(".btn-tooth-chart[data-chart='" + id + "'][data-jaw='" + jaw + "']");
	// 	obj.removeClass("btn-secondary").addClass("active");
	// }
	// $("#tooth-chart").load("images/charts/" + id + "-" + jaw + ".svg");

	$(".btn-tooth-chart[data-chart='" + id + "']").removeClass("btn-secondary").addClass("active");
	$(".tooth-chart").hide();
	// $("#tc-" + id + "-" + jaw).show();
	$("#tc-" + id + "-maxillary").show();
	$("#tc-" + id + "-mandibular").show();

	set_scored_teeth();
}

function display_current_file() {
	let f = window.current_file == "" ? `${i18n.t('default-file-name')}` : path.basename(window.current_file);
	$("#current-file").html(f + (window.is_dirty ? "*" : ""));
}

// function display_current_file(file_name, is_dirty) {
// 	$("#current-file").html(file_name + (is_dirty ? "*" : ""));
// }

function title_case(text) {
	let words = text.toLowerCase().split(" ");
	for (let i = 0; i < words.length; i++) {
		words[i] = words[i][0].toUpperCase() + words[i].slice(1);
	}
	return words.join(" ");
}

function calc_ci(perc, mu, w, b) {
	let mult = 0;
	switch(Number(perc)) {
		case 90:
			mult = 1.645;
			break;
		case 95:
			mult = 1.960;
			break;
		case 99:
			mult = 2.576;
			break;
	}
	mult=2;
	return [
		Math.exp(Number(mu) - (mult * Math.pow((Number(w) + Number(b)), 0.5)) - 0.75).toFixed(3),
		Math.exp(Number(mu) + (mult * Math.pow((Number(w) + Number(b)), 0.5)) - 0.75).toFixed(3)
	];
}




$(document).ready(function() {
	//$('[data-toggle="tooltip"]').tooltip();

	$("#btn-setup-choose").on('click', function(e) {
		e.preventDefault();
		choose_runtime_path();
	});

	$("#btn-setup-runtime").on('click', function(e) {
		e.preventDefault();
		setup_runtime();
	});

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
		show_tooth_chart($(this), $(this).data('chart'), $(this).data('jaw'));
	});
	$(".case-button").on('click', function(e) {
		$("#tab-case-info").tab('show');
	});
	$(".scoring-button").on('click', function(e) {
		$("#tab-scoring-info").tab('show');
	});
	$(".review-button").on('click', function(e) {
		$("#tab-review-info").tab('show');
	});
	$(".analyze-button").on('click', function(e) {
		$("#tab-results-info").tab('show');
		run_analysis();
	});
	$(".reset-button").on('click', function(e) {
		$("#tab-case-info").tab('show');
		reset_scores();
	});
	$("body").on('click', '.btn-clear-score', function(e) {
		e.preventDefault();
		reset_score($(this).data("tooth-id"));
	});

	$("#btn-save-settings").on('click', function(e) {
		e.preventDefault();
		save_settings();
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
		$(this).tooltip('hide');
		save_tooth_score($(this).data("tooth-id"), $(this).data("tooth-score"), false);
	});
	$("body").on('mouseenter', '.tooth-scoring-help-item', function(e) {
		e.preventDefault();
		//show_tooth_score_details($(this).data("tooth-id"), $(this).data("tooth-score"));
		$(this).tooltip('show');
	});
	$("#tooth-score").on('change', function(e) {
		e.preventDefault();
		save_tooth_score($("#tooth-score-id").val(), $("#tooth-score").val(), true);
	});

	$("#prediction-perc").on('change', function(e) {
		e.preventDefault();
		let ci = calc_ci($("#prediction-perc").val(), $("#results-mu").val(), $("#results-w").val(), $("#results-b").val());
		$("#results-lower").html(ci[0]);
		$("#results-upper").html(ci[1]);
	});

	// $("body").on('load', '#tooth-chart', function(e) {
	// 	set_scored_teeth();
	// });

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

	relocalize();
	init();
});

function relocalize() {
	i18n = getGlobal('i18n');
	const localize = locI18next.init(i18n);
	localize('body');
}

ipcRenderer.on('show-screen', (event, arg) => {
	show_screen(arg);
});

ipcRenderer.on('language-changed', (event, arg) => {
	relocalize();
});

ipcRenderer.on('new-case', (event, arg) => {
	new_case();
});
ipcRenderer.on('open-case', (event, arg) => {
	open_case();
});
ipcRenderer.on('save-case', (event, arg) => {
	save_case();
});
ipcRenderer.on('settings', (event, arg) => {
	open_settings();
});
ipcRenderer.on('setup', (event, arg) => {
	run_setup();
});












function make_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			console.error("Unable to create directory: " + err);
		}
	}
}

function empty_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			let files = fs.readdirSync(dir);
			for (var file in files) {
				fs.unlinkSync(path.join(dir, file));
			}
		} catch (err) {
			console.error("Unable to empty directory: " + err);
		}
	}
}

function copy_file(src, dest, replace) {
	var do_replace = replace;
	if (!replace) {
		do_replace = !fs.existsSync(dest);
	}

	if (do_replace) {
		fs.copyFile(src, dest, (err) => {
			if (err) {
                console.error("Unable to copy " + src + " to " + dest);
				console.error(err);
			}
		});
	}
}

function save_file(file_path, file_contents) {
	fs.writeFile(file_path, file_contents, function(err) {
		if (err) {
			console.error(err);
		}
		console.log("File saved");
	});
}

function unzip_file(zip_file, dest) {
	try {
		let z = new AdmZip(zip_file);
		z.extractAllTo(dest);
	} catch (err) {
		console.error("Unable to unzip file[" + zip_file + "]: " + err);
	}
}

function enable_button(id) {
	$("#" + id).removeAttr("disabled").removeClass("disabled");
}

function disable_button(id) {
	$("#" + id).attr("disabled", "disabled").addClass("disabled");
}
