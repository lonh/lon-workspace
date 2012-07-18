/**
 * Add click listener to open MiM window
 *
 */
chrome.browserAction.onClicked.addListener(function() {
	chrome.windows.getCurrent(function (window) {
		chrome.windows.create({
			url : "../html/main.html",
			type : "popup",
			top: window.top,
			left: parseInt(window.left + window.width - 10),
			width : 700,
			height : 600
		});
	});
});