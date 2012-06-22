window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Options = new function () {
	// private stuff
	var optiontab = $('#options-tab');
	// public stuff returned
	return {
		initialize: function () {
			var o = this;
			
			$('button.new', optiontab).click(function () {	o.newOption(); });
			$('button.save', optiontab).click(function () { o.saveOptions();});
			$('button.cancel', optiontab).click(function() { o.cancel(); });
			$('button.start', optiontab).click(function() {o.start();});
			
			$('.list', optiontab).on('click', 'button.del', function (event) {
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
			$('.template', optiontab).clone().removeClass('template').appendTo($('.list'));
		},
		cancel: function () {
			window.close();
		},
		deleteOption: function (btn) {
			$(btn).parent('.entry').remove();
		},
		saveOptions: function () {
			var options = [];
			
			$('.entry', optiontab).each(function (index, entry) {
				var elem = $(entry);
				var source = $('.source', elem).val();
				var replace = $('.replace', elem).val();
				if (source && replace) {
					options.push([source, replace, $('.toggle', elem).prop('checked')]);
				}
			});
			
			localStorage["mim_options"] = JSON.stringify(options);
			
			$('.status', optiontab).html("Options Saved.").fadeIn('slow');
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
				var entry = $('.template', optiontab).clone().removeClass('template').appendTo($('.list'));
				$('.source', entry).val(elem[0]);
				$('.replace', entry).val(elem[1]);
				$('.toggle', entry).prop('checked', elem[2]);
			});
			
		}
	}
}();


// Initialization
$(function () {
	
	// Set up options page
	lon.mim.Options.initialize();
	
	// Register web request 
	chrome.webRequest.onBeforeSendHeaders.addListener(function(info) {
		$('#monitor-tab.container').prepend($('<p>').html(info.url));
		if (/vacations\/booking\/form.js$/.test(info.url)) {
			$('.container').prepend($('<p class="intercepted">').html(info.url));
			return {
				redirectUrl : info.url.replace('d1dsp', 'lhu')
			};
		}
	},
	// filters
	{
		urls : [ "*://*.westjet.com/*", "*://*.softvoyage.com/*" ]
	},
	// extraInfoSpec
	[ "requestHeaders", "blocking" ]);
	
});