// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.webRequest.onBeforeSendHeaders.addListener(function(info) {
	
	if (/vacations\/booking\/form.js$/.test(info.url)) {
		console.log("Request: " + info.url);
		return {
			redirectUrl: info.url.replace('d1dsp', 'lhu')
		};
	}
	
//	return {
//		redirectUrl : loldogs[i]
//	};
},
// filters
{
	urls : [ "*://*.westjet.com/*",  "*://*.softvoyage.com/*"]
},
// extraInfoSpec
[ "requestHeaders","blocking" ]);