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
            list.append($('#templates .option-template').mustache({"options": [{checked: true}]}))
                .prop({'scrollTop': list.prop('scrollHeight')});
        },
        deleteOption: function (btn) {
            $(btn).parents('li').remove();
        },
        saveOptions: function () {
            
            var options = $('.entry', optiontab).map(function (index, entry) {
                var elem = $(entry);
                var source = $('.source', elem).val();
                var replace = $('.replace', elem).val();
                if (source && replace) {
                    return [[source, replace, $('.toggle', elem).prop('checked')]];
                }
            }).get();
            
            localStorage['mim_options'] = JSON.stringify(options);
            
            $(document).trigger('options.changed', [ options ]);
            
            $('.status', optiontab).html('Options Saved.').fadeIn('slow');
                setTimeout(function() {
                    $('.status').fadeOut('slow');
            }, 2000);
        },
        restoreOptions: function () {
            var mim_options = localStorage['mim_options'];
            if (mim_options) {
                var options = JSON.parse(mim_options);
                var views = $.map(options, function(elem, indx) {
                    return {source: elem[0], replace: elem[1], checked: elem[2]};
                });

                $('.list ul', optiontab)
                    .append($('#templates .option-template').mustache({options: views}));
                
                $(document).trigger('options.changed', [ options ]);
            }
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
      var empty = {checked: true};
      var list = $('.list ul', watchesTab);
      list
        .append($('#templates .watch-template').mustache({watches:empty}))
        .prop({'scrollTop': list.prop('scrollHeight')});
    },
    deleteWatch: function (btn) {
      $(btn).parents('li').remove();
    },
    saveWatches: function () {
        var watches = $('.entry', watchesTab).map(function (index, entry) {
            var elem = $(entry);
            var source = $('.source', elem).val();
            if (source) {
                return [[source, $('.toggle', elem).prop('checked')]];
            }
        }).get();
        
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
            var views = $.map(watches, function(elem, indx) {
                return {source: elem[0], checked: elem[1]};
            });

            $('.list ul', watchesTab)
                .append($('#templates .watch-template').mustache({"watches": views}));

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

                var logs = [], redirectedRequest = null;
                $.each(options, function (indx, elem) {
                    var origin = redirectedRequest || info.url;
                    if (origin.indexOf(elem[0]) !== -1) {
                        var log = {
                            'origin': origin,
                            'matcher': elem
                        };
                        
                        log.result = redirectedRequest = origin.replace(elem[0], elem[1]);
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
            $.each(watches, function (indx, watch) {
                if (info.url.indexOf(watch) != -1) {
                    o.sendNotification(watch, info);
                }
            });
        },
        sendNotification: function (watch, info) {
            var decodedUrl = this.decodeUrl(info.url);
            var notification = window.webkitNotifications.createNotification(
                    '', 
                    decodedUrl.url, 
                    decodedUrl.paramlist.join('<>'));
            notification.show();

            $(document).trigger('notification.created', [ notification ]);
        },
        appendTrace: function (url) {
          var decodedUrl = this.decodeUrl(url);
          monitorLog
            .append($('#templates .request-trace-template').mustache(decodedUrl))
            .prop({'scrollTop': monitorLog.prop('scrollHeight')});
        },
        decodeUrl: function (url) {
          var decodedUrl = decodeURIComponent(url).split('?');
          var result = {url: decodedUrl[0]};
          result.paramlist = decodedUrl.length != 1 ? decodedUrl[1].split("&") : [];

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