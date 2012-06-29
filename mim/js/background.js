/**
 * Add click listener to open MiM window
 *
 */
chrome.browserAction.onClicked.addListener(function() {
	chrome.windows.getCurrent(function (window) {
		chrome.windows.create({
			url : "../html/main.html",
			type : "popup",
			left: parseInt(window.left + window.width - 500),
			width : 1000,
			height : 600
		});
	});
});