/**
 * Add click listener
 *
 */
//  chrome.manifest = (function() {
//     var manifestObject = false;
//     var xhr = new XMLHttpRequest();

//     xhr.onreadystatechange = function() {
//         if (xhr.readyState == 4) {
//             manifestObject = JSON.parse(xhr.responseText);
//         }
//     };
//     xhr.open("GET", chrome.extension.getURL('/manifest.json'), false);

//     try {
//         xhr.send();
//     } catch(e) {}

//     return manifestObject;
// })();

chrome.browserAction.onClicked.addListener(function() {
    var title = chrome.app.getDetails().browser_action.default_title;

    chrome.windows.getAll({populate: true}, function (windows) {
        for (var i = windows.length - 1; i >= 0; i--) {
            if (windows[i].tabs) {
                var tabs = windows[i].tabs;
                for (var i = tabs.length - 1; i >= 0; i--) {
                    if (tabs[i].title === title) {
                        return;
                    }
                };
            }
        };

        startApp();
    });
});

var startApp = function() {
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
};