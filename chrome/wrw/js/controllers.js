'use strict';

/* Shared Data/Services */
mim.factory('mimCommon', ['$window', function ($window) {
	return {
		
		getParameterByName: function(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec($window.location.search);
            if(results == null) {
               return "";
           } else {
               return decodeURIComponent(results[1].replace(/\+/g, " "));
           }
        },
		
		hasQueryParam: function (url) {
			return url.indexOf('?') != -1;
        },
        
        decodeUrl: function (url) {
            var result = {'url': url};
            var decodedUrl = url.split('?');
            result.paramlist = decodedUrl.length != 1 ? decodeURIComponent(decodedUrl[1]).split("&") : [];

            for (var i = result.paramlist.length - 1; i >= 0; i--) {
                var paramString = result.paramlist[i];
                var pos = paramString.indexOf("=");
                result.paramlist[i] = {name : paramString.substring(0, pos), value : paramString.substring(pos + 1)};
            };
            
            result.paramlist.sort(function (a, b) {
    			return a.name >= b.name ? 1 : -1;
    		});

            return result;
        }
	};
}]);


mim.factory('mimOptions', function() {
	
	// Load/Initialize options from local storage
	var opt = angular.fromJson(localStorage['mim_config'] || '{}');
    opt.prefs = opt.prefs || {};
    opt.prefs.width = opt.prefs.width || 0;
    opt.prefs.height = opt.prefs.height || 0;
    
    opt.rules = opt.rules || [];
    opt.watches = opt.watches || [];
    opt.headers = opt.headers || [];
    opt.blocks = opt.blocks || [];
	opt.autoFills = opt.autoFills || [];
    
	opt.activeTab = opt.activeTab || 'Options';
	opt.activeOption = opt.activeOption || 'rules';
	
	return opt;
});


// Extra filter function
mim.filter('head', function () {
	return function (url, token) {
		return url.split(token)[0];
	};
}).filter('tail', function () {
	return function (url, token) {
		var parts = url.split(token);
		return parts.length > 1 ? parts[1] : null;
	};
});


// Basic confirmation dialog 
mim.directive('ngReallyClick', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                var message = attrs.ngReallyMessage;
                if (message && confirm(message)) {
                    scope.$apply(attrs.ngReallyClick);
                }
            });
        }
    }
}]);


/* Controllers */
var mimControllers = angular.module('mimControllers', ['ngAnimate']);


mimControllers.controller('mainController', 
		['$scope', '$window', '$document', 'mimOptions', function ($scope, $window, $document, mimOptions) {
	
	// ESC to close
    angular.element($document).on('keyup', function(event) {
        event.keyCode === 27 ? $window.close() : null;
    });
    
    angular.element($window).on('resize unload', function () {
    	
    	angular.extend(mimOptions.prefs, {
    				width: $window.outerWidth, 
    				height: $window.innerHeight,
    				top: $window.screenTop,
    				left: $window.screenLeft
    			});
        
        localStorage['mim_config'] = angular.toJson(mimOptions);
    });	

    // Document/window event
    $scope.documentKeyUp = function (event) {
        event.keyCode === 27 ? $window.close() : null;
    };

    $scope.exit = function () {
    	$window.close();
    };
    
    $scope.options = mimOptions;
    $scope.selectTab = function (tab) {
    	this.options.activeTab = tab;
    };
}]);

mimControllers.controller('optionsController', ['$scope', 'mimOptions', function ($scope, mimOptions) {

   $scope.options = mimOptions;
   
   $scope.selectOption = function (option) {
	   $scope.options.activeOption = option;
   };
       
   $scope.addOption = function () {
	   this.options[this.options.activeOption] && this.options[this.options.activeOption].push({checked: true});
   };
       
   $scope.deleteOption = function (index) {
    this.options[this.options.activeOption].splice(index, 1);
   };
       
}]);

mimControllers.controller('monitorController', 
		['$scope', '$rootScope', 'mimOptions', 'mimCommon', function ($scope, $rootScope, mimOptions, mimCommon) {
	
	var target = mimCommon.getParameterByName('tid');
	
	$scope.logs = [];
	
	$scope.clearLog = function () {
		this.logs = [];
	};
	
	$scope.type = function (log) {
		return log.block ? 'block' : (log.rule ? 'rule' : null);
	};
	
	// Register onHeaders received listener
	chrome.webRequest.onHeadersReceived.addListener(function(details) {
    	if (/xmlhttprequest|other/.test(details.type) && !!mimOptions.allowcors) { 
    		details.responseHeaders.push({
    			name: 'Access-Control-Allow-Origin',
    			value: '*'
    		});
    		
    		return {responseHeaders: details.responseHeaders};
    	}
    },
    //filters
    {
    	urls: []
    },
    [ 'blocking', 'responseHeaders' ]);
	
	
	// Register onBeforeSendHeaders listener
    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {

    	mimOptions.headers
    	.filter(function (h) {
    		return h.checked;
    	})
    	.every(function (header) {
    		// TODO should remove it before inject???
    		details.requestHeaders.push({name: header.name, value: header.value});
    		return header;
    	});
        
        return {requestHeaders: details.requestHeaders};
    },
    //filters
    {
        urls: []
    },
    [ 'blocking', 'requestHeaders' ]);
	
	
	// Register onBeforeRequest listener
    chrome.webRequest.onBeforeRequest.addListener(function(info) {
    	var blockedRequest = false;

    	// Skip if 'calleronly' enabled and tab id not matching 
        if (mimOptions.calleronly && info.tabId && info.tabId != target) {
            return;
        }

        // Check if this request should be blocked
        mimOptions.blocks
        	.filter(function (b) {
        		return b.checked;
        	})
        	.every(function (block) {
	            if (info.url.indexOf(block.block) !== -1) {
	            	$scope.logs.push({'origin': info.url, 'block': block});
	            	blockedRequest = true;
	            } else {
	            	return true;
	            }
        	});
        
        if (blockedRequest) {
        	$scope.$apply();
            return { cancel : true };
        }
       
        var redirectedRequest = null;
        mimOptions.rules
        	.filter(function (r) {
        		return r.checked;
        	})
        	.every(function (rule) {
        		var origin = redirectedRequest || info.url;
	            if (origin.indexOf(rule.source) !== -1) {
	                var log = {'origin': origin, 'rule': rule};
	                log.result = redirectedRequest = origin.split(rule.source).join(rule.replace);
	                $scope.logs.push(log);
	            }
	            
	            return rule;
        	});
        
        if (redirectedRequest) {
            return { redirectUrl : redirectedRequest };
        } else {
        	mimOptions.logallrequests ? $scope.logs.push(mimCommon.decodeUrl(info.url)) : null;
        	$rootScope.$emit('notification.check', info);
        }
        
        $scope.$apply();
    },
    // filters
    {
        urls: []
    },
    // extraInfoSpec
    [ 'blocking' ]);
    
}]);


mimControllers.controller('notificationController', 
		['$scope', '$rootScope', 'mimOptions', 'mimCommon', function ($scope, $rootScope, mimOptions, mimCommon) {
	
	$scope.notices = [];
	$scope.dsNotifications = [];
	
	$scope.clearNotices = function () {
		this.dsNotifications.every(function (n, index) {
			chrome.notifications.clear(n, function (wasCleared) {});
			
			return n;
		});
		this.notices = [];
		this.dsNotifications = [];
	};
	
	$rootScope.$on('notification.check', function (event, info) {
		
      mimOptions.watches
      	.filter(function (w) {
      		return w.checked;
      	})
      	.every(function (watch, index) {
	      if (info.url.indexOf(watch.source) != -1) {
	
	     	 // Store to notices list
	     	 var notice = mimCommon.decodeUrl(info.url);
	     	 notice.url = info.url;
	     	  
	     	 $scope.notices.push(notice);
	     	 
	     	 // Send desktop notification if enabled
	     	 mimOptions.shownotifications ?
	     		chrome.notifications.create(
	     		'', 
	     		{ type:'basic', title: watch.source, iconUrl: '/img/binoculars-icon-16.png', message: notice.url}, 
	     		function (id) {$scope.dsNotifications.push(id);}) : null;
	      }
	      
	      return watch;
      });
	});
}]);


mimControllers.controller('formController', 
		['$scope', '$rootScope', '$timeout', 'mimOptions', 'mimCommon', function ($scope, $rootScope, $timeout, mimOptions, mimCommon) {
	
	var wid = mimCommon.getParameterByName('wid');
	
	$scope.autoFills = mimOptions.autoFills;
	
	$scope.successPopulated = false;
	
	$scope.showIndex = -1;
	
	$scope.show = function (index) {
		return index === $scope.showIndex;
	};
	
	$scope.toggle = function (index) {
		$scope.showIndex = index;
	}
	
	$scope.deleteAutofill = function (index) {
		$scope.autoFills.splice(index, 1);
	};
	
	$scope.fillSelected = function () {
		return !!$scope.selectedFill;
	}
	
	$scope.record = function (){
		chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
  			for ( var i = 0; i < window.tabs.length; i ++) {
  				var tab = window.tabs[i];
				if (tab.active) {
					chrome.tabs.sendMessage(
	    				  tab.id,
	    				  {
	    					  action : "record",
	    					  'target': tab.id,
	    				  }, 
	    				  function (response) {
	    					  $scope.autoFills.push(response);
	    					  $scope.$apply();
	    				  }
		    		  );
					
					break;
				}
			}
  		});
	};
	
	 $scope.populate = function () {
    	if ($scope.selectedFill) {
    		var data = $scope.autoFills[$scope.selectedFill];
    		
    		// Set request to page to de-serialize form
    		chrome.windows.get(parseInt(wid), {populate: true}, function (window) {
    			var tab = window.tabs.filter(function (tab, index) {
    				return tab.active;
    			})[0];
    			
				chrome.tabs.sendMessage(
    				tab.id,
    				{
    					action : "fill",
    					'target': tab.id,
    					'data': data 
    				}, 
    				function (response) {
    					$scope.$apply(function () {
    						$scope.successPopulated = true;    						
    					});
    					
    					$timeout(function () {$scope.successPopulated = false;}, 2000);
    				}
    			);
    		});
    	}
	 };
	 
	 
}]);