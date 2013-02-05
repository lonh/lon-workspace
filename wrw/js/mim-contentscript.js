
var record = function() {
  var inputs = $(':input').filter(':visible');
  var values = inputs.map(function (index, entry) {
    var elem = $(entry);

    var value = elem.val();
    if (value) {
      return {
        'name': elem.attr('name'),
        'id': elem.attr('id'),
        'value': value
      }
    } 
   
  }).get();
  
  return values;
} 

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action == "record") {
        var results = record();
        var response = {
          'title': document.title || window.location.href,
          'hostname': window.location.hostname,
          'results' : results
        };

        //console.log(response);
        sendResponse(response);
      }
      
      return true;
    }
);