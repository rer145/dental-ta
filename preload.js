'use strict';

window.$ = window.jQuery = require('jquery');
//window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

console.log("preload complete");

// prep settings, etc.


$(document).ready(function() {
	$(".screen-link").on('click', function(e) {
		$(".screen").hide();
		$("#" + $(this).data('screen') + "-screen").show();
	});
});
