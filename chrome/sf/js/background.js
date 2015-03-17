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

        var tab = null;
        tabs.some(function ($tab, index) {
            if (/privileges/i.test($tab.title)) {
                tab = $tab;
                return true;
            }
        });

        if (!tab) {
            chrome.notifications.create('-1', {
                iconUrl: 'img/sf-icon-48.png',
                type: 'basic',
                title: '',
                message: 'Please log in Travel Privileges and try again!'
            }, function () {});

            return;
        }

        chrome.tabs.executeScript(tab.id, { file: "js/jquery-2.1.3.min.js" }, function () {
            chrome.tabs.executeScript(tab.id, { file: "js/contentscript.js" }, function () {
                var sf_options = localStorage['sf_config'];
                var opt = sf_options ? JSON.parse(sf_options) : {};
                var prefs = opt.prefs || {};

                var params = {
                    url: "html/main.html?wid=" + tab.windowId + "&tid=" + tab.id,
                    type: "popup",
                    width: parseInt(prefs.width || 800),
                    height: parseInt(prefs.height || 640)
                };

                prefs.top ? params.top = parseInt(prefs.top) : null;
                prefs.left ? params.left = parseInt(prefs.left) : null;

                chrome.windows.create(params);
            });
        });
    });
};