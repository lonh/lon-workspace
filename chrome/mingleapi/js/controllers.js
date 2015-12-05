'use strict';

/* Shared Data/Services */
ma.factory('maCommon', ['$window', function ($window) {
	return {

    formatDate : function (date) {
      return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
    },

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
            var param = result.paramlist[i].split("=");
            result.paramlist[i] = {name : param[0], value : param[1]};
        };

        result.paramlist.sort(function (a, b) {
    			return a.name >= b.name ? 1 : -1;
    		});

        return result;
    }
	};
}]);

// Retrieve options
ma.factory('maOptions', function() {
  
  // Load/Initialize options from local storage
  var opt = angular.fromJson(localStorage['ma_config'] || '{}');
    opt.prefs = opt.prefs || {};
    opt.prefs.width = opt.prefs.width || 0;
    opt.prefs.height = opt.prefs.height || 0;
    
    opt.from = opt.from || ['YYC'];
    opt.to = opt.to || [];
    opt.flex = opt.flex || 0;

    opt.dep = opt.dep ? new Date(opt.dep) : new Date($.now() + 3 * 86400000);
    opt.ret = opt.ret ? new Date(opt.ret) : null;
  
  return opt;
});


/* Controllers */

ma.controller('mainController', ['$scope', '$window', '$document', '$timeout', 'maOptions',  
  function ($scope, $window, $document, $timeout, maOptions) {

    // Document/window event
    $scope.documentKeyup = function (event) {
        event.keyCode === 27 ? $window.close() : null;
    };

    angular.element($window).on('resize unload', function () {
      
      angular.extend(maOptions.prefs, {
        width: $window.outerWidth, 
        height: $window.innerHeight,
        top: $window.screenTop,
        left: $window.screenLeft
      });
        
      localStorage['ma_config'] = angular.toJson(maOptions);
    });
}]);

ma.controller('apiController', ['$scope', '$window', '$document', '$timeout', 'maCommon', 'maOptions', 
    function ($scope, $window, $document, $timeout, maCommon, maOptions) {

    var wid = parseInt(maCommon.getParameterByName('wid'));
    var tid = parseInt(maCommon.getParameterByName('tid'));
    
    $scope.options = maOptions;
    $scope.card = {};
    
    $scope.clear = function () {
      $scope.card.name = 'Test';
      $scope.card.number = '1277';
      $scope.card.description = 'Test again';
    }

    $scope.create = function () {
      chrome.tabs.sendMessage(
          tid,
          angular.extend( {}, {card: $scope.card}, {action: 'create'}),
          function (response) {
              // Continue next search      
              $scope.$apply();
         }
      );
    }

    $scope.isEmpty = function () {
      return $scope.card.name && $scope.card.number && $scope.card.desciption;
    }

    $timeout(function() {
        chrome.tabs.sendMessage(
           tid,
           {
            action: 'airports'
           },
           function (response) {
              response && response.status == 'success';
              $scope.$apply();
           }
        );
    }, 2000);

}]);