
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {

    	jQuery.globalEval(request.action);
    	sendResponse(request);
    	
    	return true;
    }
);