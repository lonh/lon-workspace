window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Main = new function () {
    // Private stuff
    
    // Public stuff
    return {
        initialize: function () {
            var o = this;
            
            $('#main-menu').buttonset();
            $('button').button();
            
            // Set up tab actions
            $('#main-menu input').on('click', function(event){
                o.switchTab($(this).attr('id'));
            });
            
            // retrieve previous stored tab id
            var defaultTab = localStorage['mim_prefs.tab'] || 'options';
            $('input#' + defaultTab).attr('checked', 'true').button('refresh');

            o.switchTab(defaultTab);
            
            $(document).keyup(function(event) {
                event.keyCode === 27 ? window.close() : null;
            });
            
            $(window).on('resize', function (){
                localStorage['mim_preferences.width']=document.width;
                localStorage['mim_preferences.height']=document.height;
            });

            $('button.exit').on('click', function () { window.close(); });
            
            $('#options-tab .list ul')
                .sortable({ 
                        axis: 'y',
                        containment: 'parent',
                        revert: false
                        })
                .disableSelection();
        },
        switchTab: function (tabId) {
            $('.container').hide().filter('#'+tabId+'-tab').show();
            
            // Store into preferences
            localStorage['mim_prefs.tab']=tabId;
        }
    }
}();

lon.mim.Options = new function () {
    // private stuff
    var optiontab = null;
    // public stuff returned
    return {
        initialize: function () {
            var o = this;
            
            optiontab = $('#options-tab');
            
            $('button.new', optiontab).on('click', function () { o.newOption(); });
            $('button.save', optiontab).on('click', function () { o.saveOptions(); });
            
            optiontab.on('change', '.source, .replace, .toggle', function () {o.saveOptions();});
            
            $('.list', optiontab).on('click', '.del', function (event) {
                o.deleteOption(this);
                o.saveOptions();
            });
            
            this.restoreOptions();
            
            $('#options-tab .list ul').sortable({'update': o.saveOptions});
        },
        newOption: function () {
            var list = $('.list ul', optiontab);
            $('#templates ul li.option').clone().appendTo(list);
            list.prop({'scrollTop': list.prop('scrollHeight')});
        },
        deleteOption: function (btn) {
            $(btn).parents('li').remove();
        },
        saveOptions: function () {
            var o = this;
            var options = [];
            
            $('.entry', optiontab).each(function (index, entry) {
                var elem = $(entry);
                var source = $('.source', elem).val();
                var replace = $('.replace', elem).val();
                if (source && replace) {
                    options.push([source, replace, $('.toggle', elem).prop('checked')]);
                }
            });
            
            localStorage['mim_options'] = JSON.stringify(options);
            
            $(document).trigger('options.changed', [ options ]);
            
            $('.status', optiontab).html('Options Saved.').fadeIn('slow');
                setTimeout(function() {
                    $('.status').fadeOut();
            }, 2000);
        },
        restoreOptions: function () {
            var mim_options = localStorage['mim_options'];
            if (!mim_options) {
                return;
            }
            
            var options = JSON.parse(mim_options);
            $.each(options, function(indx, elem) {
                var entry = $('#templates ul li.option').clone().appendTo($('.list ul', optiontab));
                $('.source', entry).val(elem[0]);
                $('.replace', entry).val(elem[1]);
                $('.toggle', entry).prop('checked', elem[2]);
            });
            
            $(document).trigger('options.changed', [ options ]);
        }
    }
}();

lon.mim.Watcher = new function () {
  // Private stuff
  var watchesTab = null;
  var notifications = [];
  // public stuff
  return {
    initialize : function () {
      var o = this;
      
      watchesTab = $('#watches-tab');
      
      $('button.new', watchesTab).on('click', function () {  o.newWatch(); });
      $('button.clear', watchesTab).on('click', function () {  
        while (notifications.length) {
            try {
                notifications.pop().close();
            } catch(e){}
         };
      });

      watchesTab.on('change', '.source, .toggle', function () {o.saveWatches();});

      $('.list', watchesTab).on('click', '.del', function (event) {
        o.deleteWatch(this);
        o.saveWatches();
      });
      
      o.restoreWatches();

      $(document).on('notification.created', function (event, data) {
        o.addNotifications(data);
      });
    },
    addNotifications: function(notification) {
        notifications.push(notification);
    },
    newWatch: function () {
      var list = $('.list ul', watchesTab);
      $('#templates ul li.watch').clone().appendTo(list);
      list.prop({'scrollTop': list.prop('scrollHeight')});
    },
    deleteWatch: function (btn) {
      $(btn).parents('li').remove();
    },
    saveWatches: function () {
        var o = this;
        var watches = [];
        
        $('.entry', watchesTab).each(function (index, entry) {
            var elem = $(entry);
            var source = $('.source', elem).val();
            if (source) {
                watches.push([source, $('.toggle', elem).prop('checked')]);
            }
        });
        
        localStorage['mim_watches'] = JSON.stringify(watches);
        
        $(document).trigger('watches.changed', [ watches ]);
        
        $('.status', watchesTab).html('Watches Saved.').fadeIn('slow');
        setTimeout(function() {
            $('.status').fadeOut();
        }, 2000);
    },
    restoreWatches: function () {
        var min_watches = localStorage['mim_watches'];
        if (min_watches) {

            var watches = JSON.parse(min_watches);
            $.each(watches, function(indx, elem) {
                var entry = $('#templates ul li.watch').clone().appendTo($('.list ul', watchesTab));
                $('.source', entry).val(elem[0]);
                $('.toggle', entry).prop('checked', elem[2]);
            });

            $(document).trigger('watches.changed', [ watches ]);
        }
    }
  };
  
}();

lon.mim.Monitor = new function () {
    // Private stuff
    var options = [];
    var watches = [];
    var monitorLog = null;
    // Public stuff
    return {
        initialize: function () {
            var o = this;
            
            this.registerListener();
            
            monitorLog = $('#monitor-tab .list .items');
            
            $('#monitor-tab button.clear').click(function () {
                o.clearLog();
            });
            
            $(document).on('options.changed', function (event, data) {
                o.updateOptions(data);
            });

            $(document).on('watches.changed', function (event, data) {
                o.updateWatches(data);
            });
        },
        registerListener: function () {
            var o = this;
            
            // Register web request
            chrome.webRequest.onBeforeRequest.addListener(function(info) {

                var logs = [], finalRequest = null;
                for ( var int = 0; int < options.length; int++) {
                    var elem = options[int];
                    if ((finalRequest || info.url).indexOf(elem[0]) !== -1) {
                        var log = {
                            'origin': finalRequest || info.url,
                            'matcher': elem
                        };
                        
                        finalRequest = (finalRequest || info.url).replace(elem[0], elem[1]);
                        
                        log.result = finalRequest;
                        logs.push(log);
                    }
                }
                
                if (finalRequest) {
                    o.displayLogging(logs);
                    return { redirectUrl : finalRequest };
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
            $.each(watches, function (indx, watch) {
                if (info.url.indexOf(watch) != -1) {
                    o.sendNotification(watch, info);
                }
            });
        },
        sendNotification: function (watch, info) {
            var decodedUrl = decodeURIComponent(info.url);

            var notification = window.webkitNotifications.createNotification('/img/icon.png', watch, decodedUrl.split(/[?&]/).join('<>'));

            $(document).trigger('notification.created', [ notification ]);

            notification.show();
        },
        appendTrace: function (url) {
          var decodedUrl = this.decodeUrl(url);
             
          $('#templates .request-trace-template').clone().mustache(decodedUrl).appendTo(monitorLog);
          monitorLog.prop({'scrollTop': monitorLog.prop('scrollHeight')});
        },
        decodeUrl: function (url) {
          var decodedUrl = decodeURIComponent(url);
          var result = {url: decodedUrl};
          result.paramlist = this.hasQueryParam(decodedUrl) ? decodedUrl.substring(decodedUrl.indexOf('?') + 1).split("&") : [];

          return result;
        },
        hasQueryParam: function (url) {
          return url.indexOf('?') != -1;
        },
        displayLogging: function (logs) {
            var matchers = $.map(logs, function(log, index) {
                var origins = log.origin.split(log.matcher[0]);
                var results = log.result.split(log.matcher[1]);

                return {
                    ohead: origins[0],
                    obody: log.matcher[0],
                    otail: origins.length > 1 ? origins[1] : null,
                    rhead: results[0],
                    rbody: log.matcher[1],
                    rtail: results.length > 1 ? results[1] : null
                };
            });

            var logTemplate = $('#templates .request-log-template');
            monitorLog
                .append(logTemplate.mustache({"matchers": matchers}))
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
}();

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
    
    // Set up watcher page
    lon.mim.Watcher.initialize();
});