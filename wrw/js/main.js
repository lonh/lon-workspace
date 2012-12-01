window.lon = window.lon || {};
lon.mim = lon.mim || {};

lon.mim.Main = new function () {
    // Private stuff
    
    // Public stuff
    return {
        options: {},
        initialize: function () {
            var o = this;
            
            // Load options first
            this.loadOptions();

            $(document).on('options.updated', function () {
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
                $(document).trigger('options.updated');
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
            $(document).trigger('options.changed');
        },
        loadOptions: function () {
            var opt = {};
            var mim_options = localStorage['mim_config'];
            if (mim_options) {
                opt = JSON.parse(mim_options);
            }

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
            
            $('.list ul', optiontab)
                .sortable({ 
                        axis: 'y',
                        containment: 'parent',
                        revert: false,
                        'update': o.saveOptions
                        })
                .disableSelection();

            this.loadOptions();
        },
        newOption: function () {
            var list = $('.list ul', optiontab);
            list.append($('#templates .rule-template').mustache({"rules": [{checked: true}]}))
                .prop({'scrollTop': list.prop('scrollHeight')});
        },
        deleteOption: function (btn) {
            $(btn).parents('li').remove();
        },
        saveOptions: function () {
            
            var rules = $('.entry', optiontab).map(function (index, entry) {
                var elem = $(entry);
                var source = $('.source', elem).val();
                var replace = $('.replace', elem).val();
                if (source && replace) {
                    return [[source, replace, $('.toggle', elem).prop('checked')]];
                }
            }).get();
            
            lon.mim.Main.options.rules = rules;
            lon.mim.Main.options.notification = $('#notification', optiontab).val();
            lon.mim.Main.options.calleronly = $('#calleronly', optiontab).val();
            
            $(document).trigger('options.updated');
            
            $('.status', optiontab).html('Options Saved.').fadeIn('slow');
                setTimeout(function() {
                    $('.status').fadeOut('slow');
            }, 2000);
        },
        loadOptions: function () {
            var views = $.map(lon.mim.Main.options.rules, function(elem, indx) {
                return {source: elem[0], replace: elem[1], checked: elem[2]};
            });

            $('.list ul', optiontab)
                .append($('#templates .rule-template').mustache({rules: views}));
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
        
        $(document).trigger('watches.updated', [ watches ]);
        
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

            $(document).trigger('watches.updated', [ watches ]);
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
            
           /* $(document).on('options.changed', function (event, data) {
                o.updateOptions(data);
            });

            $(document).on('watches.changed', function (event, data) {
                o.updateWatches(data);
            });*/
        },
        registerListener: function () {
            var o = this;
            
            // Register web request
            chrome.webRequest.onBeforeRequest.addListener(function(info) {

                var logs = [], redirectedRequest = null;
                $.each(lon.mim.Main.options.rules, function (indx, elem) {
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
            $.each(lon.mim.Main.options.watches, function (indx, watch) {
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