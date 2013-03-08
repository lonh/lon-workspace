window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Main = new function () {
    // Private stuff
    
    // Public stuff
    return {
        options: {},
        eventMessages: {'OptionsChanged': 'options.changed', 'NotificationFired':'notification.fired'},
        eventHub: null,
        initialize: function () {
            var o = this;
            
            // Load options first
            o.loadOptions();

            // Set up event hub
            o.eventHub = $.mhub.create()
            o.eventHub.add(o.eventMessages.OptionsChanged);
            o.eventHub.add(o.eventMessages.NotificationFired);

            o.eventHub.listen(o.eventMessages.OptionsChanged, function (data) {
                o.updateOptions();
            });

            // Set up top tab buttons
            $('#main-menu').buttonset();
            // Set up tab actions
            $('#main-menu input').on('click', function(event){
                o.switchTab($(this).attr('id'));
            });
            
            // ESC to close
            $(document).keyup(function(event) {
                event.keyCode === 27 ? window.close() : null;
            });
            
            $(window).on('resize', function (){
                options.prefs.width=document.width; 
                options.prefs.height=document.height;
                o.eventHub.send(o.eventMessages.OptionsChanged);
            });

            $('button').button();
            $('button.exit').on('click', function () { window.close(); });
            
            // retrieve previous stored tab id
            var defaultTab = o.options.prefs.tab || 'options';
            $('input#' + defaultTab).attr('checked', 'true').button('refresh');

            o.switchTab(defaultTab);
        },
        switchTab: function (tabId) {
            $('.container').hide().filter('#'+tabId+'-tab').show();
            
            // Store into preferences
            this.options.prefs.tab = tabId;
            this.eventHub.send(this.eventMessages.OptionsChanged);
        },
        loadOptions: function () {
            var mim_options = localStorage['mim_config'];
            var opt = mim_options ? JSON.parse(mim_options) : {};
            opt.prefs = opt.prefs || {};
            opt.rules = opt.rules || [];
            opt.watches = opt.watches || [];

            this.options = opt;
        },
        updateOptions: function () {
            localStorage['mim_config'] = JSON.stringify(this.options);
        }
    }
}();

lon.mim.Options = new function (main) {
    // private stuff
    var optiontab = null;
    var list = null;
    
    // public stuff returned
    return {
        initialize: function () {
            var o = this;
            
            optiontab = $('#options-tab');
            list = $('.list ul', optiontab);
            
            $('button.new-rule', optiontab).on('click', function () { o.newRule(); });
            $('button.new-watch', optiontab).on('click', function () { o.newWatch(); });
            $('button.save', optiontab).on('click', function () { o.saveOptions(); });
            
            optiontab.on('change', '.source, .replace, .toggle', function () {o.saveOptions();});
            
            list.on('click', '.del', function (event) {
                    o.deleteOption(this);
                    o.saveOptions();
                })
                .sortable({ 
                    axis: 'y',
                    containment: 'parent',
                    revert: false,
                    'update': o.saveOptions
                })
                .disableSelection();

            this.loadOptions();
        },
        newRule: function () {
            list.append($('#templates .rule-template').mustache({"rules": [{checked: true}]}))
                .prop({'scrollTop': list.prop('scrollHeight')});
        }, 
        newWatch: function () {
            list.append($('#templates .watch-template').mustache({"watches": [{checked: true}]}))
                .prop({'scrollTop': list.prop('scrollHeight')});
        },
        deleteOption: function (btn) {
            $(btn).parents('li').remove();
        },
        saveOptions: function () {
            var entries = $('.entry', optiontab);
            var rules = entries.map(function (index, entry) {
                var elem = $(entry);
                var source = $('.source', elem).val();
                var replace = $('.replace', elem).val();
                if (source && replace) {
                    return [{'source': source, 'replace': replace, 'checked': $('.toggle', elem).prop('checked')}];
                }
            }).get();
            
            var watches = entries.map(function (index, entry) {
                var elem = $(entry);
                var source = $('.source', elem).val();
                var replace = $('.replace', elem).val();
                if (source && !replace) {
                    return [{'source': source, 'checked': $('.toggle', elem).prop('checked')}];
                }
            }).get();

            main.options.rules = rules;
            main.options.watches = watches;
            main.options.shownotifications = $('#shownotifications', optiontab).prop('checked');
            main.options.calleronly = $('#calleronly', optiontab).prop('checked');
            
            main.eventHub.send(main.eventMessages.OptionsChanged);
            
            $('.status', optiontab).html('Options Saved.').fadeIn('slow');
                setTimeout(function() {
                    $('.status').fadeOut('slow');
            }, 2000);
        },
        loadOptions: function () {
            list.append($('#templates .rule-template').mustache({rules: main.options.rules}));
            list.append($('#templates .watch-template').mustache({watches: main.options.watches}));

             $('#shownotifications', optiontab).prop('checked', main.options.shownotifications);
             $('#calleronly', optiontab).prop('checked', main.options.calleronly);
        }
    }
}(lon.mim.Main);

lon.mim.notifications = new function (main) {
  // Private stuff
  var notificationsTab = null;
  var notificationLog = null;
  var notifications = [];
  // public stuff
  return {
    initialize : function () {
      var o = this;
      
      notificationsTab = $('#notifications-tab');
      notificationLog = $('.list .items', notificationsTab);
      
      $('button.clear', notificationsTab).on('click', function () {  
        while (notifications.length) {
            try {
                notifications.pop().close();
            } catch(e){}
         };

         notificationLog.empty();
      });

      //$(document).on('notification.fired', function (event, decodedUrl) {
      main.eventHub.listen(main.eventMessages.NotificationFired, function(decodedUrl) {
        o.displayNotification(decodedUrl);

        if (main.options.shownotifications) {
            var notification = window.webkitNotifications.createNotification(
                '', // No logo
                decodedUrl.url, 
                decodedUrl.paramlist.join('<>'));
            notification.show();

            notifications.push(notification);
        }
      });
    },
    displayNotification: function (notification) {
        notificationLog
            .append($('#templates .notification-log-template').mustache(notification))
            .prop({'scrollTop': notificationLog.prop('scrollHeight')});
    }
  };
  
}(lon.mim.Main);

lon.mim.Monitor = new function (main) {
    // Private stuff
    var options = [];
    var watches = [];
    var monitorLog = null;
    var target = null;
    // Public stuff
    return {
        initialize: function () {
            var o = this;
            
            this.registerListener();
            
            target = o.getParameterByName("target");

            monitorLog = $('#monitor-tab .list .items');
            
            $('#monitor-tab button.clear').click(function () {
                o.clearLog();
            });
        },
        getParameterByName: function(name) {
             name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
             var regexS = "[\\?&]" + name + "=([^&#]*)";
             var regex = new RegExp(regexS);
             var results = regex.exec(window.location.search);
             if(results == null) {
                return "";
            } else {
                return decodeURIComponent(results[1].replace(/\+/g, " "));
            }
        },
        registerListener: function () {
            var o = this;
            
            // Register web request
            chrome.webRequest.onBeforeRequest.addListener(function(info) {

                if (main.options.calleronly && info.tabId && info.tabId != target) {
                    return;
                }

                var logs = [], redirectedRequest = null;
                $.each(main.options.rules, function (indx, rule) {
                    var origin = redirectedRequest || info.url;
                    if (rule.checked && origin.indexOf(rule.source) !== -1) {
                        var log = {
                            'origin': origin,
                            'rule': rule
                        };
                        // Split/join could be fast than replace with /matcher/g way ???
                        log.result = redirectedRequest = origin.split(rule.source).join(rule.replace);
                        logs.push(log);
                    }
                });
                
                if (redirectedRequest) {
                    o.displayLogging(logs);
                    return { redirectUrl : redirectedRequest };
                } else {
                    o.checkRequestForWatch(info);
                    o.appendTrace(info.url);
                }
            },
            // filters
            {
                urls: []
            },
            // extraInfoSpec
            [ 'blocking' ]);
        },
        checkRequestForWatch: function (info) {
            var o = this;
            $.each(main.options.watches, function (indx, watch) {
                if (watch.checked && info.url.indexOf(watch.source) != -1) {
                    o.sendNotification(watch, info);
                }
            });
        },
        sendNotification: function (watch, info) {
            var decodedUrl = this.decodeUrl(info.url);
            //$(document).trigger('notification.fired', [ decodedUrl ]);
            main.eventHub.send(main.eventMessages.NotificationFired, decodedUrl);
        },
        appendTrace: function (url) {
          var decodedUrl = this.decodeUrl(url);
          monitorLog
            .append($('#templates .request-trace-template').mustache(decodedUrl))
            .prop({'scrollTop': monitorLog.prop('scrollHeight')});
        },
        decodeUrl: function (url) {
          var result = {'url': url};
          var decodedUrl = url.split('?');
          result.paramlist = decodedUrl.length != 1 ? decodeURIComponent(decodedUrl[1]).split("&") : [];

          return result;
        },
        hasQueryParam: function (url) {
          return url.indexOf('?') != -1;
        },
        displayLogging: function (logs) {
            var matchers = $.map(logs, function(log, index) {
                var origins = log.origin.split(log.rule.source);
                var results = log.result.split(log.rule.replace);

                return {
                    ohead: origins[0],
                    obody: log.rule.source,
                    otail: origins.length > 1 ? origins[1] : null,
                    rhead: results[0],
                    rbody: log.rule.replace,
                    rtail: results.length > 1 ? results[1] : null
                };
            });

            //TODO while there are more than one occurrences, this is only displaying first one
            monitorLog
                .append($('#templates .request-log-template').mustache({"matchers": matchers}))
                .prop({'scrollTop': monitorLog.prop('scrollHeight')});
        },
        updateOptions: function (data) {
            options = [];
            $.each(data, function (indx, elem) {
                if (!!elem[2]) {
                    //options.push([new RegExp(elem[0]), elem[1]]);
                    options.push([elem[0], elem[1]]);
                }
            });
        },
        updateWatches: function (data) {
            watches = [];
            $.each(data, function (indx, elem) {
                if (!!elem[1]) {
                    watches.push(elem[0]);
                }
            });
        },
        clearLog: function () {
            monitorLog.empty();
        }
    }
}(lon.mim.Main);


lon.mim.autofill = new function (main) {
  // Private stuff
  var autofillTab = null;
  var autofillLog = null;
  var list = null;
  var autofills = [];
  // public stuff
  return {
    initialize : function () {
      var o = this;
      
      autofillTab = $('#autofills-tab');
      list = $('.list ul', autofillTab);
      
      autofills = localStorage['mim_autofills'] ? JSON.parse(localStorage['mim_autofills']) : [];
      
      var target = lon.mim.Monitor.getParameterByName("target");
      
      $('button.record', autofillTab).on('click', function () {
        chrome.tabs.sendMessage(
            parseInt(target),
            {
              action : "record",
              'target': target,
            }, 
            o.storeAutofills  
          );
      });

      $('button.fill', autofillTab).on('click', o.autofillForms);
      
      o.displayautofill(autofills);
      
      list.on('click', '.del', function (event) {
          o.deleteAutoFills(this);
          o.saveAutoFills();
      });

    },
    deleteAutoFills: function () {
    	
    },
    storeAutofills: function (response) {
        autofills.push(response);
        localStorage['mim_autofills'] = JSON.stringify(autofills);
        console.log(localStorage['mim_autofills']);
    },
    displayautofill: function (autofills) {
    	list.append($('#templates .autofill-template').mustache({'autofills': autofills}));
    },
    autofillForms: function () {
    	var o = this;
    	
    	// Get selected form index
    	var radioButtons = $("input:radio[name='autofills']", autofillTab);
    	var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
    	
    	// Get proper entry from autofills object
    	var data = autofills[selectedIndex];
    	
    	// Set request to page to deserialize form
    	var target = lon.mim.Monitor.getParameterByName("target");
    	chrome.tabs.sendMessage(
                parseInt(target),
                {
                  action : "fill",
                  'target': target,
                  'data': data 
                }, 
                o.fillformCallback  
              );
    	
    },
    fillformCallback: function () {
    	
    }
    
  };
  
}(lon.mim.Main);

// Initialization
$(function () {
    // Set up main page
    lon.mim.Main.initialize();
    
    // Set up monitor
    // !!!IMPORTANT 
    // this need to be run before option intialization
    // to catch options.changed event
    lon.mim.Monitor.initialize();

    // Set up options page
    lon.mim.Options.initialize();
    
    // Set up notifications page
    lon.mim.notifications.initialize();
    
    // Set up autofill page
    lon.mim.autofill.initialize();
    
    
});