
chrome.browserAction.onClicked.addListener(function() {
    var title = chrome.app.getDetails().browser_action.default_title;

    chrome.windows.getAll({populate: true}, function (windows) {
        var appwindow = null;

        allwindows:
        for (var i = windows.length - 1; i >= 0; i--) {
            if (windows[i].tabs) {
                var tabs = windows[i].tabs;
                for (var j = tabs.length - 1; j >= 0; j--) {
                    if (tabs[j].title === title) {
                        appwindow = windows[i];
                        break allwindows;
                    }
                };
            }
        };

        if (appwindow) {
            chrome.windows.update(appwindow.id, {focused: true});
        } else {
            startApp();
        }
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

        var mim_options = localStorage['mim_config'];
        var opt = mim_options ? JSON.parse(mim_options) : {};
        var prefs = opt.prefs || {};
        var w = parseInt(prefs.width || 640);
        var h = parseInt(prefs.height || 400);
        var t = parseInt(prefs.top || window.top);
        var l = parseInt(prefs.left || (window.left + window.width + 30 - w));
        
        chrome.windows.create({
            url: "../html/main.html?wid=" + window.id + "&tid=" + tabId,
            type: "popup",
            top: t,
            left: l,
            width: w,
            height: h
        });
    });
};