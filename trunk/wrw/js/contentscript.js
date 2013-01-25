//chrome.extension.sendMessage({
//  greeting : "hello"
//}, function(response) {
//  console.log(response.farewell);
//});

var record = function() {
  var inputs = $(':input');
  var values = inputs.map(function (index, entry) {
    var elem = $(entry);
    return {
      id: elem.attr('id'),
      value: elem.val()
    }
  }).get();
  
  return values;
} 

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action == "record") {
        var results = record();
        sendResponse({
          'results' : results
        });
      }
      
      return true;
    }
);