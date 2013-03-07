var record = function() {
  var values = [];
  
  $('form').each(function (index, form) {
	  // Collect hidden elements
	  var hiddens = {};
	  $('input:hidden', this).each(function(index, element) {
		  hiddens[$(this).attr('name')] = true;
	  });
	  
	  // Collect all form data
	  var data = $(this).serializeArray();
	  
	  // Trim off hidden elements
	  for ( var int = data.length - 1; int >= 0; int--) {
		if (hiddens[data[int].name]) {
			data.splice(int, 1);
		}
	  }
	  
	  values.push(data);
  });

  return values;
} 

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
    	switch (request.action) {
		case 'record':
			var results = record();
			var response = {
					'pagename': document.title || window.location.href,
					'hostname': window.location.hostname,
					'forms' : results
			};
			
			sendResponse(response);
			
			break;
		case 'fill':
			var forms = request.data.forms;
			$('form').each(function (index, form) {
				$(this).deserialize(forms[index]);
			});
			
			break;

		default:
			break;
		}
    	
    	return true;
    }
);