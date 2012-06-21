function save_options() {
	var color = $("#color").val();
	// var color = select.children[select.selectedIndex].value;
	localStorage["favorite_color"] = color;
	// Update status to let user know options were saved.
	// var status = document.getElementById("status");
	// status.innerHTML = "Options Saved.";
	$('status').html("Option Saved.");
	setTimeout(function() {
		$('status').html("");
	}, 750);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
	var favorite = localStorage["favorite_color"];
	if (!favorite) {
		return;
	}
	var select = document.getElementById("color");
	for ( var i = 0; i < select.children.length; i++) {
		var child = select.children[i];
		if (child.value == favorite) {
			child.selected = "true";
			break;
		}
	}
}

window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Options = new function () {
	// private stuff
	
	// public stuff returned
	return {
		initialize: function () {
			var o = this;
			
			$('button.new').click(function () {	o.newOption(); });
			$('button.save').click(function () { o.saveOptions();});
			$('button.cancel').click(function() { o.cancel(); });
			$('button.start').click(function() {o.start();});
			
			$('.list').on('click', 'button.del', function (event) {
				o.deleteOption(this);
			});
			
			this.restoreOptions();
		},
		start: function () {
			chrome.windows.create({
				url : "../html/monitor.html",
				type : "popup",
				width : 800,
				height : 600
			});
		},
		newOption: function () {
			$('.template').clone().removeClass('template').appendTo($('.list'));
		},
		cancel: function () {
			window.close();
		},
		deleteOption: function (btn) {
			$(btn).parent('.entry').remove();
		},
		saveOptions: function () {
			var options = [];
			
			$('.entry').each(function (index, entry) {
				var elem = $(entry);
				var source = $('.source', elem).val();
				var replace = $('.replace', elem).val();
				if (source && replace) {
					options.push([source, replace, $('.toggle', elem).prop('checked')]);
				}
			});
			
			localStorage["mim_options"] = JSON.stringify(options);
			
			$('.status').html("Options Saved.").fadeIn('slow');
				setTimeout(function() {
					$('.status').fadeOut();
			}, 2000);
		},
		restoreOptions: function () {
			var options = localStorage["mim_options"];
			if (!options) {
				return;
			}
			
			options = JSON.parse(options);
			$.each(options, function(indx, elem) {
				var entry = $('.template').clone().removeClass('template').appendTo($('.list'));
				$('.source', entry).val(elem[0]);
				$('.replace', entry).val(elem[1]);
				$('.toggle', entry).prop('checked', elem[2]);
			});
			
		}
	}
}();


// Initialization
$(function () {
	lon.mim.Options.initialize();
});