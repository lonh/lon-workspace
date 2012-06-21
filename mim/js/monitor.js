// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.webRequest.onBeforeSendHeaders.addListener(function(info) {
	
	$('.container').append($('<p>').html(info.url));
	
	if (/vacations\/booking\/form.js$/.test(info.url)) {
		
		$('.container').append($('<p class="intercepted">').html(info.url));
		return {
			redirectUrl : info.url.replace('d1dsp', 'lhu')
		};
	}

	// return {
	// redirectUrl : loldogs[i]
	// };
},
// filters
{
	urls : [ "*://*.westjet.com/*", "*://*.softvoyage.com/*" ]
},
// extraInfoSpec
[ "requestHeaders", "blocking" ]);

//chrome.browserAction.onClicked.addListener(function() {
//	chrome.windows.getCurrent(function(win) {
//		chrome.tabs.getSelected(win.id, actionClicked);
//	});
//});
//
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