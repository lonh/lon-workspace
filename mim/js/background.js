
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

//var version = "1.0";
//
//function actionClicked(tab) {
//	chrome.debugger.detach({
//		tabId : tab.id
//	});
//	
//	chrome.debugger.attach({
//		tabId : tab.id
//	}, version, onAttach.bind(null, tab.id));
//}
//
//function onAttach(tabId) {
//	if (chrome.extension.lastError) {
//		alert(chrome.extension.lastError.message);
//		return;
//	}
//
//	chrome.windows.create({
//		url : "../html/headers.html?" + tabId,
//		type : "popup",
//		width : 800,
//		height : 600
//	});
//}