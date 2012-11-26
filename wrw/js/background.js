/**
 * Add click listener to open MiM window
 *
 */
chrome.browserAction.onClicked.addListener(function() {
    chrome.windows.getCurrent({populate: true}, function (window) {
        var tabId = null;
        for (var i = 0; i < window.tabs.length; i++) {
            if (window.tabs[i].active) {
                tabId = window.tabs[i].id;
                break;
            }
        };

        chrome.windows.create({
            url : "../html/main.html" + (tabId ? "?target=" + tabId : ""),
            type : "popup",
            top: window.top,
            left: parseInt(window.left + window.width - 10),
            width : parseInt(localStorage['mim_preferences.width']) || 700,
            height : parseInt(localStorage['mim_preferences.height']) || 600
        });
    });
});