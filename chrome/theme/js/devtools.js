var xhr = new XMLHttpRequest();
xhr.open('GET', '/css/custom.css');
xhr.onload = function() {
    chrome.devtools.panels.applyStyleSheet(xhr.responseText);
};
xhr.send();