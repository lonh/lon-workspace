window.lon = window.lon || {};
lon.fs = lon.fs || {};

lon.fs.Main = new function () {
    // Private stuff
    var timer = null,
    alarmsList = $('#alarms-list'),
    template = $('#template'),
    currentTime = $('#time'),
    wid = null,
    eventHub = $.mhub.create(),
    DATA_TIMEOUT_KEY = 'data-timeout',
    eventMessages = {
    	'OptionsChanged': 'options.changed', 
        'AlarmFired':'alarm.fired'
    };
    
    // Public stuff
    return {
        options: {},
        initialize: function () {
            var o = this;
            
            wid = o.getParameterByName('wid');

            // Set up event hub
            eventHub.add(eventMessages.OptionsChanged);
            eventHub.add(eventMessages.AlarmFired);

            eventHub.listen(eventMessages.OptionsChanged, function (data) {
                o.saveOptions();
            });
            
            eventHub.listen(eventMessages.AlarmFired, function (data) {
                o.alarmFired(data);
            });

            // ESC to close
            $(document).keyup(function(event) {
                event.keyCode === 27 ? window.close() : null;
            });
            
            $(window).on('unload', function (e) {
            	$.extend(o.options.prefs, {
            		width: window.outerWidth, 
            		height: window.innerHeight,
            		top: window.screenTop,
            		left: window.screenLeft
            	});
            	
                eventHub.send(eventMessages.OptionsChanged);
            });

            o.setupButtons();
            
            //load data
            o.loadOptions();
            
            // Start the timer
            timer = setInterval(function () { o.updateTime(); }, 100);
        },
        setupButtons: function () {
        	var o = this;
        	
        	// New alarm button
        	$('button#new-alarm').on('click', function () {
        		o.insertAlarms({'alarms': [{'time': o.getInitialExecutionTime(), 'actions': ['']}]});
        	});
        	
        	// Alarm button actions
        	alarmsList.on('click', 'button.add-action', function (e) {
        		$(this).siblings('div.actions-list').append(o.createAction());
        	})
        	.on('click', 'button.remove-action', function (e) {
        		$(this).parents('div.action').remove();
        	})
        	.on('click', 'button.delete-alarm', function (e) {
        		$(this).parents('div.alarm').remove();
        	})
        	.on('click', 'button.start', function (e) {
        		o.start($(this).parents('div.alarm'));
        	})
        	.on('click', 'button.stop', function (e) {
        		o.stop($(this).parents('div.alarm'));
        	})
        	.on('click', 'button.test', function (e) {
        		o.executeAlarm($(this).parents('div.alarm'));
        	});
        	
        },
        start: function (alarm) {
        	var o = this;
        	
            var delay = o.calculateCountdown(alarm);
            if (delay <= 0) {
            	alert('Can not start in the past, please update time!');
            	return;
            } else {
            	alarm.find('.seconds').html(delay/1000);
            }
            
            var timeout = setTimeout(function() {o.executeAlarm(alarm);}, delay);
            
            o.toggleExecution(alarm, timeout);
        },
        stop: function (alarm) {
        	this.toggleExecution(alarm);
        },
        updateTime: function () {
        	var o = this;
        	
        	currentTime.html(new Date().toLocaleString());
        	
        	alarmsList.find('.alarm').each(function (index) {
        		var alarm = $(this);
        		if (alarm.data(DATA_TIMEOUT_KEY)) {
        			alarm.find('.seconds').html(o.calculateCountdown(alarm)/1000);
        		}
        	});
        },
        insertAlarms: function (alarms) {
        	var alarm = template.mustache(alarms);
    		alarmsList.append(alarm);
    		setTimeout(function () {alarm.toggleClass('small-scaled');}, 1);
        },
        createAction: function () {
        	return action = template.find('.actions-list').mustache({actions:['']});
        },
        getInitialExecutionTime: function () {
        	var o = this;
        	
        	var d =  new Date();
            d.setMinutes(d.getMinutes() + 10);
            return [d.getFullYear(), '-', o.pad(d.getMonth()+1, 2), '-', o.pad(d.getDate(), 2), 
            		 'T', d.getHours(), ':', o.pad(d.getMinutes(), 2), ':01.001'].join('');
        },
        calculateCountdown: function (alarm) {
        	var date = new Date();
        	var alarmTime = new Date(alarm.find('input[name=execution-time]').val());
            var time = alarmTime.getTime() + date.getTimezoneOffset() * 60 * 1000 - date.getTime();
            
            return time;
        },
        toggleExecution: function (alarm, timeout) {
        	alarm.find('.countdown, button.start, button.stop').toggle();
        	alarm.find('input[name=execution-time]').each(function () {
        		this.disabled = !this.disabled;
        	});
        	
        	if (timeout === undefined) {
        		clearTimeout(alarm.data(DATA_TIMEOUT_KEY));
        		alarm.removeData(DATA_TIMEOUT_KEY);
        	} else {
        		alarm.data(DATA_TIMEOUT_KEY, timeout);
        	}
        },
        executeAlarm : function (alarm) {
        	console.log(new Date().getMilliseconds());
            chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
                for ( var i = 0; i < window.tabs.length; i ++) {
                    var tab = window.tabs[i];
                    if (tab.active) {
                        chrome.tabs.sendMessage(
                           tab.id,
                           {
                               action : alarm.find('*[name=action]').map(function () {
                            	   return $(this).val();
                               }).get().join(';'),
                               'target': tab.id,
                               timeoutId: alarm.data(DATA_TIMEOUT_KEY)
                           }, 
                           function (response) {
                               eventHub.send(eventMessages.AlarmFired, response);
                           });
                         
                        break;
                    }
                }
            });
        },
        alarmFired: function (response) {
            console.log(new Date().getMilliseconds());
            if (response || !response.timeoutId) {
                return;
            }

        	var o = this;
        	
        	alarmsList.find('.alarm').each(function (index) {
        		var alarm = $(this);
        		
        		if (response && alarm.data(DATA_TIMEOUT_KEY) == response.timeoutId) {
        			o.toggleExecution(alarm);
        			var d = new Date(),
        				ms = d.getMilliseconds(),
        				dataparts = d.toLocaleString().split(' ');
        			
        			dataparts[dataparts.length - 2] = dataparts[dataparts.length - 2] + "." + o.pad(ms, 3);
        			
        			alarm.find('.triggeredtime span').html(dataparts.join(' '));
        		}
        	});
        },
        pad: function (number, length) {
            var str = '' + number;
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        },
        getParameterByName: function(name) {
            name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
            var regexS = '[\\?&]' + name + '=([^&#]*)';
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.search);
            if(results == null) {
               return '';
           } else {
               return decodeURIComponent(results[1].replace(/\+/g, ' '));
           }
        },
        loadOptions: function () {
        	var options = localStorage['fs.config'];
            var opt = options ? JSON.parse(options) : {};
            opt.prefs = opt.prefs || {};
            opt.prefs.width = opt.prefs.width || 0;
            opt.prefs.height = opt.prefs.height || 0;
            opt.alarms = opt.alarms || [];

            this.options = opt;
            this.insertAlarms(opt);
        },
        updateOptions: function () {
            localStorage['fs.config'] = JSON.stringify(this.options);
        },
        saveOptions: function () {
           var alarms = alarmsList.find('div.alarm').map(function (index, entry) {
        	   var alarm = $(this);
               return [{
            	   		time: alarm.find('[name=execution-time]').val(), 
            	   		actions: 
            	   			alarm.find('[name=action]')
	               			.map(function() {
	               				return $(this).val();
	               			})
	               			.get()
	               	  }];
           }).get();
           
           this.options.alarms = alarms;
           this.updateOptions();
           
        }
    }
}();

// Initialization
$(function () {
    // Set up main page
    lon.fs.Main.initialize();
});