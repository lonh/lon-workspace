// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.webRequest.onBeforeRequest.addListener(function(info) {
	console.log("Request: " + info.url);
	
	chrome.tabs.sendRequest(1, {url: info.url}, function(response) {
	  console.log(response);
	});
	console.log("Sent Request! ");
//	return {
//		redirectUrl : loldogs[i]
//	};
},
// filters
{
	urls : [ "http://*/*" ]
},
// extraInfoSpec
[ "blocking" ]);