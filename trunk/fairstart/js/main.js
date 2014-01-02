window.lon = window.lon || {};
lon.fs = lon.fs || {};

lon.fs.Main = new function () {
    // Private stuff
    var timer = null;
    var alarmTimeout = null;
    var control = $('#control');
    var alarmsList = $('#alarms-list');
    var template = $('#template');
    var wid = null;
    var eventHub = $.mhub.create();
    
    // Public stuff
    return {
        options: {},
        eventMessages: {
        	'OptionsChanged': 'options.changed', 
            'AlarmFired':'alarm.fired'
        },
        initialize: function () {
            var o = this;
            
            // Load options first
            o.loadOptions();

            wid = o.getParameterByName('wid');

            // Set up event hub
            eventHub.add(o.eventMessages.OptionsChanged);
            eventHub.add(o.eventMessages.AlarmFired);

            eventHub.listen(o.eventMessages.OptionsChanged, function (data) {
                o.updateOptions();
            });

            // ESC to close
            $(document).keyup(function(event) {
                event.keyCode === 27 ? window.close() : null;
            });
            
            $(window).on('unload', function (e) {
            	$.extend(o.options.prefs, {
            		width: this.outerWidth, 
            		height: this.outerHeight,
            		top: this.screenTop,
            		left: this.screenLeft
            	});
            	
                eventHub.send(o.eventMessages.OptionsChanged);
            });

            o.setupButtons();
            
            // Start the timer
            timer = setInterval(o.updateTime, 1000);
            
            var d =  new Date();
            d.setMinutes(d.getMinutes() + 10);
            $('input[name=time]').val(
            		[d.getFullYear(), '-', o.pad(d.getMonth()+1, 2), '-', o.pad(d.getDate(), 2), 
            		 'T', d.getHours(), ':', o.pad(d.getMinutes(), 2), ':01.001'].join(''));
            //$('input[name=time]').val(d.getHours()+':' + o.pad(d.getMinutes(), 2) + ':01.001');
            
        },
        setupButtons: function () {
        	var o = this;
        	
        	$('button#new-alarm').on('click', function () {
        		template.find('div.alarm').clone().appendTo(alarmsList);
        	});
        	
        	// Set up record button events
        	$('button#test').on('click', o.executeAlarm);
        	
        	// Alarm butotn actions
        	alarmsList.on('click', 'button.add-action', function (e) {
        		template.find('div.action').clone().appendTo($(this).parents('div.actions-list'));
        	})
        	.on('click', 'button.remove-action', function (e) {
        		$(this).parents('div.action').remove();
        	})
        	.on('click', 'button.delete-alarm', function (e) {
        		$(this).parents('div.alarm').remove();
        	})
        	.on('click', 'button.add-queue', function (e) {
        		//$(this).parents('div.alarm').remove();
        	})
        	.on('click', 'button.remove-queue', function (e) {
        		//$(this).parents('div.alarm').remove();
        	})
        	.on('click', 'button.test', function (e) {
        		o.executeAlarm($(this).parents('div.alarm'));
        	});
        	
        },
        start: function (o) {
        	control.html('STOP');
        	//timer = setInterval(o.updateTime, 15);

            var date = new Date();
            //$('.time').html(date.toLocaleString());

            var alarmTime = new Date(date.toLocaleDateString() + ' ' + $('input[name=time]').val());
            var timeout = alarmTime.getTime() - date.getTime();

            alarmTimeout = setTimeout(o.executeAlarm, timeout);
        },
        stop: function (o) {
        	control.html('START');
        	clearTimeout(alarmTimeout);
        },
        updateTime: function () {
        	var date = new Date();
        	$('.time').html(date.toLocaleString());

            //var alarmTime = new Date($('input[name=time]').val());

            //$('input[name=parameter]').val((alarmTime.getTime() + date.getTimezoneOffset() * 60 * 1000 - date.getTime()) / 1000);

        },
        executeAlarm : function (alarm) {
            chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
                for ( var i = 0; i < window.tabs.length; i ++) {
                    var tab = window.tabs[i];
                    if (tab.active) {
                        chrome.tabs.sendMessage(
                               tab.id,
                               {
                                   action : alarm.find('*[name=action]').val(),
                                   'target': tab.id,
                               }, 
                               function (response) {
                                   eventHub.send(main.eventMessages.AutoFillsAdded, response);
                               }
                           );
                         
                        break;
                    }
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

            this.options = opt;
        },
        updateOptions: function () {
            localStorage['fs.config'] = JSON.stringify(this.options);
        }
    }
}();

//
//lon.fs.Options = new function (main) {
//    // private stuff
//    var optiontab = null;
//    var list = null;
//    
//    // public stuff returned
//    return {
//        initialize: function () {
//            var o = this;
//            
//            optiontab = $('#options-tab');
//            list = $('.list', optiontab);
//            
//            $('.new-rule', optiontab).on('click', function () { o.newRule(); });
//            $('.new-watch', optiontab).on('click', function () { o.newWatch(); });
//            $('.new-header', optiontab).on('click', function () { o.newHeader(); });
//            $('.new-block', optiontab).on('click', function () { o.newBlock(); });
//            
//            optiontab
//            	.on('change', 'input', function () {o.saveOptions();})
//            	.on('click', '.close', function (event) {
//	                o.deleteOption(this);
//	                o.saveOptions();
//	            });
//
//            this.loadOptions();
//        },
//        newRule: function () {
//        	optiontab.find('a[href=#rules]').tab('show');
//            $('#rules').append($('#templates .rule-template').mustache({'rules': [{checked: true}]}))
//                .prop({'scrollTop': list.prop('scrollHeight')});
//        }, 
//        newWatch: function () {
//        	optiontab.find('a[href=#watches]').tab('show');
//            $('#watches').append($('#templates .watch-template').mustache({'watches': [{checked: true}]}))
//                .prop({'scrollTop': list.prop('scrollHeight')});
//        },
//        newHeader: function () {
//        	optiontab.find('a[href=#headers]').tab('show');
//            $('#headers').append($('#templates .request-header-template').mustache({'headers': [{checked: true}]}))
//                .prop({'scrollTop': list.prop('scrollHeight')});
//        },
//        newBlock: function () {
//        	optiontab.find('a[href=#blocks]').tab('show');
//            $('#blocks').append($('#templates .block-template').mustache({'blocks': [{checked: true}]}))
//                .prop({'scrollTop': list.prop('scrollHeight')});
//        },
//        deleteOption: function (btn) {
//            $(btn).parents('.entry').remove();
//        },
//        saveOptions: function () {
//            var rules = optiontab.find('#rules .entry').map(function (index, entry) {
//                var elem = $(entry);
//                var source = elem.find('.source').val();
//                var replace = elem.find('.replace').val();
//                var checked = elem.find('.toggle').prop('checked');
//                if (source && replace) {
//                    return [{'source': source, 'replace': replace, 'checked': checked}];
//                }
//            }).get();
//            
//            var watches = optiontab.find('#watches .entry').map(function (index, entry) {
//                var elem = $(entry);
//                var watch = elem.find('.watch').val();
//                var checked = elem.find('.toggle').prop('checked');
//                if (watch) {
//                    return [{'source': watch, 'checked': checked}];  // backwards compatibility 'source'
//                }
//            }).get();
//
//            var headers = optiontab.find('#headers .entry').map(function (index, entry) {
//                var elem = $(entry);
//                var name = elem.find('.name').val();
//                var value = elem.find('.value').val();
//                var checked = elem.find('.toggle').prop('checked');
//                if (name) {
//                    return [{'name': name, 'value': value, 'checked': checked}];
//                }
//            }).get();
//            
//            var blocks = optiontab.find('#blocks .entry').map(function (index, entry) {
//                var elem = $(entry);
//                var block = elem.find('.block').val();
//                var checked = elem.find('.toggle').prop('checked');
//                if (block) {
//                    return [{'block': block, 'checked': checked}];
//                }
//            }).get();
//
//            $.extend(main.options, {
//            	'headers' : headers,
//                'rules' : rules,
//                'watches' :  watches,
//                'blocks' : blocks,
//                'shownotifications' : $('#shownotifications', optiontab).prop('checked'),
//                'calleronly' : $('#calleronly', optiontab).prop('checked'),
//                'logallrequests' : $('#logallrequests', optiontab).prop('checked')
//            });
//            
//            main.eventHub.send(main.eventMessages.OptionsChanged);
//            
//            this.updateOptionVisual();
//
//            $('.options-saved').stop(true, true).show().fadeOut(1500);
//        },
//        loadOptions: function () {
//            $('#rules', optiontab).append($('#templates .rule-template').mustache({rules: main.options.rules}));
//            $('#watches', optiontab).append($('#templates .watch-template').mustache({watches: main.options.watches}));
//            $('#blocks', optiontab).append($('#templates .block-template').mustache({blocks: main.options.blocks}));
//            $('#headers', optiontab).append($('#templates .request-header-template').mustache({headers: main.options.headers}));
//
//             $('#shownotifications', optiontab).prop('checked', main.options.shownotifications);
//             $('#calleronly', optiontab).prop('checked', main.options.calleronly);
//             $('#logallrequests', optiontab).prop('checked', main.options.logallrequests);
//
//             // Update option visual stat
//             this.updateOptionVisual();
//        },
//        updateOptionVisual: function () {
//            optiontab.find('.entry').removeClass('selected').has('.toggle:checked').addClass('selected');
//        }
//    }
//}(lon.fs.Main);
//
//lon.fs.notifications = new function (main) {
//  // Private stuff
//  var notificationsTab = null;
//  var notificationLog = null;
//  var notifications = [];
//  // public stuff
//  return {
//    initialize : function () {
//      var o = this;
//      
//      notificationsTab = $('#notifications-tab');
//      notificationLog = $('.list', notificationsTab);
//      
//      $('button.clear', notificationsTab).on('click', function () {  
//        while (notifications.length) {
//            try {
//                notifications.pop().close();
//            } catch(e){}
//         };
//
//         notificationLog.empty();
//      });
//
//      //$(document).on('notification.fired', function (event, decodedUrl) {
//      main.eventHub.listen(main.eventMessages.NotificationFired, function(decodedUrl) {
//        o.displayNotification(decodedUrl);
//
//        if (main.options.shownotifications) {
//            var notification = window.webkitNotifications.createNotification(
//                '', // No logo
//                decodedUrl.url, 
//                '');
//            notification.show();
//
//            notifications.push(notification);
//        }
//      });
//    },
//    displayNotification: function (notification) {
//        notificationLog
//            .append($('#templates .notification-log-template').mustache(notification))
//            .prop({'scrollTop': notificationLog.prop('scrollHeight')});
//    }
//  };
//  
//}(lon.fs.Main);
//
//lon.fs.Monitor = new function (main) {
//    // Private stuff
//    var options = [];
//    var watches = [];
//    var monitorLog = null;
//    var target = null;
//    // Public stuff
//    return {
//        initialize: function () {
//            var o = this;
//            
//            this.registerListener();
//            
//            target = main.getParameterByName('tid');
//
//            monitorLog = $('#monitor-tab .list');
//            
//            $('#monitor-tab button.clear').click(function () {
//                o.clearLog();
//            });
//        },
//        registerListener: function () {
//            var o = this;
//            
//            // Register onBeforeSendHeaders listener
//            chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
//
//                $.each(main.options.headers, function (indx, header) {
//                    if (header.checked) {
//                        details.requestHeaders.push({name: header.name, value: header.value});
//                    }
//                });
//
//                return {requestHeaders: details.requestHeaders};
//            },
//            //filters
//            {
//                urls: []
//            },
//            [ 'blocking', 'requestHeaders' ]);
//
//            // Register onBeforeRequest listener
//            chrome.webRequest.onBeforeRequest.addListener(function(info) {
//
//                if (main.options.calleronly && info.tabId && info.tabId != target) {
//                    return;
//                }
//
//                var logs = [], redirectedRequest = null, blockedRequest = false;
//                
//                $.each(main.options.blocks, function (indx, block) {
//                    if (block.checked && info.url.indexOf(block.block) !== -1) {
//                    	logs.push({'origin': info.url, 'block': block});
//                    	blockedRequest = true;
//                    	return false;
//                    }
//                });
//                
//                if (blockedRequest) {
//                	o.displayLogging(logs);
//                    return { cancel : true };
//                }
//                
//                
//                $.each(main.options.rules, function (indx, rule) {
//                    var origin = redirectedRequest || info.url;
//                    if (rule.checked && origin.indexOf(rule.source) !== -1) {
//                        var log = {
//                            'origin': origin,
//                            'rule': rule
//                        };
//                        // Split/join could be fast than replace with /matcher/g way ???
//                        log.result = redirectedRequest = origin.split(rule.source).join(rule.replace);
//                        logs.push(log);
//                    }
//                });
//                
//                if (redirectedRequest) {
//                    o.displayLogging(logs);
//                    return { redirectUrl : redirectedRequest };
//                } else {
//                    o.checkRequestForWatch(info);
//                    
//                    if (main.options.logallrequests) {
//                    	o.appendTrace(info.url);                    	
//                    }
//                }
//            },
//            // filters
//            {
//                urls: []
//            },
//            // extraInfoSpec
//            [ 'blocking' ]);
//        },
//        checkRequestForWatch: function (info) {
//            var o = this;
//            $.each(main.options.watches, function (indx, watch) {
//                if (watch.checked && info.url.indexOf(watch.source) != -1) {
//                    o.sendNotification(watch, info);
//                }
//            });
//        },
//        sendNotification: function (watch, info) {
//            var decodedUrl = this.decodeUrl(info.url);
//            //$(document).trigger('notification.fired', [ decodedUrl ]);
//            main.eventHub.send(main.eventMessages.NotificationFired, decodedUrl);
//        },
//        appendTrace: function (url) {
//          var decodedUrl = this.decodeUrl(url);
//
//          monitorLog
//            .append($('#templates .request-trace-template').mustache(decodedUrl))
//            .prop({'scrollTop': monitorLog.prop('scrollHeight')});
//        },
//        decodeUrl: function (url) {
//          var result = {'url': url};
//          var decodedUrl = url.split('?');
//          result.paramlist = decodedUrl.length != 1 ? decodeURIComponent(decodedUrl[1]).split('&') : [];
//
//          for (var i = result.paramlist.length - 1; i >= 0; i--) {
//              var param = result.paramlist[i].split('=');
//              result.paramlist[i] = {name : param[0], value : param[1]};
//          };
//
//          return result;
//        },
//        hasQueryParam: function (url) {
//          return url.indexOf('?') != -1;
//        },
//        displayLogging: function (logs) {
//            var matchers = $.map(logs, function(log, index) {
//            	
//            	if (log.block) {
//            		var origins = log.origin.split(log.block.block);
//            		return {
//            			ohead: '[BLOCKED] ' + origins[0],
//                        obody: log.block.block,
//                        otail: origins.length > 1 ? origins[1] : null,
//            		};
//            	} else {
//            		var origins = log.origin.split(log.rule.source);
//            		var results = log.result.split(log.rule.replace);
//            		
//            		return {
//            			ohead: '[ORIGIN] ' + origins[0],
//            			obody: log.rule.source,
//            			otail: origins.length > 1 ? origins[1] : null,
//            			rhead: '[REDIRECT] ' + results[0],
//            			rbody: log.rule.replace,
//            			rtail: results.length > 1 ? results[1] : null
//            		};
//            	}
//            	
//            });
//
//            //TODO while there are more than one occurrences, this is only displaying first one
//            monitorLog
//                .append($('#templates .request-log-template').mustache({'matchers': matchers}))
//                .prop({'scrollTop': monitorLog.prop('scrollHeight')});
//        },
//        updateOptions: function (data) {
//            options = [];
//            $.each(data, function (indx, elem) {
//                if (!!elem[2]) {
//                    //options.push([new RegExp(elem[0]), elem[1]]);
//                    options.push([elem[0], elem[1]]);
//                }
//            });
//        },
//        updateWatches: function (data) {
//            watches = [];
//            $.each(data, function (indx, elem) {
//                if (!!elem[1]) {
//                    watches.push(elem[0]);
//                }
//            });
//        },
//        clearLog: function () {
//            monitorLog.empty();
//        }
//    }
//}(lon.fs.Main);
//
//
//lon.fs.autofill = new function (main) {
//  // Private stuff
//  var autofillTab = null;
//  var list = null;
//  var status = null;
//  var autofills = [];
//  var wid = main.getParameterByName('wid');
//  // public stuff
//  return {
//    initialize : function () {
//      var o = this;
//
//      main.eventHub.listen(main.eventMessages.AutoFillsChanged, function (data) {
//          o.updateAutoFills();
//      });
//      
//      main.eventHub.listen(main.eventMessages.AutoFillsAdded, function (data) {
//          o.addAutoFill(data);
//      });
//      
//      main.eventHub.listen(main.eventMessages.AutoFillsUploaded, function (data) {
//          o.uploadAutoFill(data);
//      });
//      
//      autofillTab = $('#autofills-tab'),
//      list = $('.list', autofillTab),
//      status = $('.status', autofillTab);
//
//      
//      // Set up record button events
//      $('button.record', autofillTab).on('click', function () {
//    	  
//    	  chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
//  			for ( var i = 0; i < window.tabs.length; i ++) {
//  				var tab = window.tabs[i];
//					if (tab.active) {
//						chrome.tabs.sendMessage(
//		    				  tab.id,
//		    				  {
//		    					  action : 'record',
//		    					  'target': tab.id,
//		    				  }, 
//		    				  function (response) {
//		    					  main.eventHub.send(main.eventMessages.AutoFillsAdded, response);
//		    				  }
//			    		  );
//						
//						break;
//					}
//				}
//  		});
//      });
//
//      // Set up fill button 
//      $('button.fill', autofillTab).on('click', function () {
//    	  o.autofillForms(); 
//      });
//      
//      // Set up form data button
//      $('button.form-data').on('click', function () {
//    	  var dialog = $('#dialog-form-data');
//    	  dialog
//    	  .on('shown.bs.modal', function () {
//    		  dialog.find('.form-data-content').html(localStorage[.fs.autofills']).select();
//    		  dialog.find('.save').off().click(function (e) {
//    			  main.eventHub.send(main.eventMessages.AutoFillsUploaded, $('.form-data-content').val());
//    			  dialog.modal('hide');
//    		  });
//    	  })
//    	  .modal('show');
//      });
//
//      
//	  list.on('click', '.close', function (event) {
//	    var close = $(this);
//	    var dialog = $('#dialog-delete-form-entry');
//	    
//	    dialog
//	    	.on('shown.bs.modal', function (e) {
//	    		dialog.find('.ok').off('click').on('click', function (event) {
//	    			close.parents('div.entry').remove();
//	    			main.eventHub.send(main.eventMessages.AutoFillsChanged);
//	    			dialog.modal('hide');	    	
//	    		});
//	    	})	
//	    	.modal('show');
//	  });
//
//      
//
//      // Set up delete autofill
//      list.on('change', '.form-data input', function (event) {
//    	  main.eventHub.send(main.eventMessages.AutoFillsChanged);
//      });
//      
//      // Set up click event on form-data to toggle radio button & list
//      list.on('click', 'a.pagename', function (event) {
//    	  $(this)
//    	  	.siblings('.toggle').trigger('click').end()
//    	  	.siblings('ol.fields-list').slideToggle('slow');
//    	  
//      });
//      
//      // Initial load/display auto fills
//      autofills = JSON.parse(localStorage[.fs.autofills'] || '[]');
//      o.displayAutofill();
//    },
//    updateAutoFills: function () {
//    	autofills.length = 0; // reset
//    	
//    	$('.form-data', autofillTab).each(function (index, element) {
//    		var o = $(this);
//    		
//    		var forms = [];
//    		$('form', o).each(function (index, elem) {
//    			forms.push($(this).serializeArray());
//    		});
//    		
//            if (forms.length != 0) {
//                autofills.push({
//                    'pagename': $('input[name=pagename]', o).val(),
//                    'hostname': $('input[name=hostname]', o).val(),
//                    'comment': $('input[name=comment]', o).val(),
//                    'forms': forms
//                });
//            }
//    		
//    	});
//    	
//    	localStorage[.fs.autofills'] = JSON.stringify(autofills);
//    	
//    	$('.form-data-saved').stop(true, true).show().fadeOut(1500);
//    },
//    addAutoFill: function (autofill) {
//    	if (undefined != autofill && autofill.forms && autofill.forms.length != 0) {
//    		autofills.unshift(autofill);
//    		localStorage[.fs.autofills'] = JSON.stringify(autofills);
//    		
//    		list.empty();
//    		this.displayAutofill();
//    	}
//    },
//    uploadAutoFill: function (autofillData) {
//    	localStorage[.fs.autofills'] = autofillData;
//    	autofills = JSON.parse(autofillData);
//    	list.empty();
//    	this.displayAutofill();
//    },
//    displayAutofill: function () {
//        if (autofills && autofills.length != 0) {
//    	   list.append($('#templates .autofill-template').mustache({'autofills': autofills}));
//        }
//    },
//    autofillForms: function () {
//    	var o = this;
//    	
//    	// Get selected form index
//    	var radioButtons = $('input:radio[name='autofills']', autofillTab);
//    	var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
//    	
//    	if (selectedIndex != -1) {
//    		// Get proper entry from autofills object
//    		var data = autofills[selectedIndex];
//    		
//    		// Set request to page to deserialize form
//    		chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
//    			for ( var i = 0; i < window.tabs.length; i ++) {
//    				var tab = window.tabs[i];
//					if (tab.active) {
//						chrome.tabs.sendMessage(
//		    					tab.id,
//		    					{
//		    						action : 'fill',
//		    						'target': tab.id,
//		    						'data': data 
//		    					}, 
//		    					function (response) {
//		    						o.fillformCallback(response);
//		    					}
//		    			);
//						
//						break;
//					}
//				}
//    		});
//    	} else {
//            $('#dialog-choose-form').modal('show');
//    	}
//    },
//    fillformCallback: function (response) {
//    	$('.form-data-saved').html(response.msg).stop(true, true).show().fadeOut(1500);
//    }
//  };
  
//}(lon.fs.Main);

// Initialization
$(function () {
    // Set up main page
    lon.fs.Main.initialize();
    
    // Set up monitor
    // !!!IMPORTANT!!!
    // this need to be run before option intialization
    // to catch options.changed event
    //lon.fs.Monitor.initialize();

    // Set up options page
    //lon.fs.Options.initialize();
    
    // Set up notifications page
    //lon.fs.notifications.initialize();
    
    // Set up autofill page
    //lon.fs.autofill.initialize();
});