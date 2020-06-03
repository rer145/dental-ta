'use strict';

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
		show_tooth_chart($(".btn-tooth-chart").first(), $(".btn-tooth-chart").first().data('chart'));
	}

	screen.show();
}

function show_tooth_chart(obj, id) {
	//var obj = $("#tooth-chart");
	$(".btn-tooth-chart").removeClass("btn-primary");
	obj.removeClass("btn-secondary").addClass("btn-primary");
	//$("#tooth-chart img").attr("src", "images/charts/" + id + "-maxillary.png");
	//$("#tooth-chart img").attr("src", "images/charts/" + id + ".svg");

	$("#tooth-chart").load("images/charts/" + id + ".svg");
	// $.get("images/charts/" + id + ".svg", function(data) {
	// 	$("#tooth-chart").append(data);
	// });
}

function display_current_file() {
	$("#current-file").html(window.current_file + (window.is_dirty ? "*" : ""));
}

// function display_current_file(file_name, is_dirty) {
// 	$("#current-file").html(file_name + (is_dirty ? "*" : ""));
// }

module.exports = {
	show_screen,
	show_tooth_chart,
	display_current_file
};
