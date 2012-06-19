// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.devtools.panels.create("Requests",
                              "icon.png",
                              "headers.html",
                              function(panel) {});
				
console.log('++++++++++++++++++++++++++++++++++++++hi++++++++++');
			  
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    
      ssendResponse("Got it!");
  });