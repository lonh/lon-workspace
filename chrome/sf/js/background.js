/*
Attach extension click event
*/
chrome.browserAction.onClicked.addListener(function() {
    var title = chrome.app.getDetails().browser_action.default_title;

    chrome.windows.getAll({populate: true}, function (windows) {
        var appwindow = null;

        windows.every(function (window, index) {
            window.tabs.every(function (tab, index) {
                if (tab.title === title) {
                    appwindow = window;
                    return false; // Breakout now
                }

                return tab;
            });

            return !appwindow;
        });

        appwindow ? chrome.windows.update(appwindow.id, {focused: true}) : startApp();
    });
});

var startApp = function() {
    chrome.tabs.query({}, function (tabs) {

        var tabId = -1;

        var found = tabs.some(function (tab, index) {
            if (/privileges/i.test(tab.title)) {
                tabId = tab.id;
                return true;
            }
        });

        if (!found) {
            chrome.notifications.create({
                iconUrl: 'img/sf-icon-16.png',
                type: 'basic',
                title: '',
                message: 'Please log in Travel Privileges and try again!'
            });

            return;
        }

        chrome.tabs.executeScript(tabId, { file: "js/jquery-2.1.3.min.js" }, function () {
            chrome.tabs.executeScript(tabId, { file: "js/contentscript.js" });
        });

        var sf_options = localStorage['sf_config'];
        var opt = sf_options ? JSON.parse(sf_options) : {};
        var prefs = opt.prefs || {};

        var params = {
            url: "html/main.html?wid=" + window.id + "&tid=" + tabId,
            type: "popup",
            top: parseInt(prefs.top || window.top),
            left: parseInt(prefs.left || (window.left + window.width + 30 - (prefs.width || 1024))),
            width: parseInt(prefs.width || 1024),
            height: parseInt(prefs.height || 640)
        };

        chrome.windows.create(params);
    });
};