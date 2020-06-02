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
	screen.show();
}

function display_current_file() {
	$("#current-file").html(window.current_file + (window.is_dirty ? "*" : ""));
}

// function display_current_file(file_name, is_dirty) {
// 	$("#current-file").html(file_name + (is_dirty ? "*" : ""));
// }

module.exports = {
	show_screen,
	display_current_file
};
