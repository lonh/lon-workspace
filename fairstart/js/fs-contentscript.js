
chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {

    	eval(request.action);
    	sendResponse(request);
    	
    	return true;
    }
);