'use strict';

window.sf_throttle = 50;

/* Shared Data/Services */
sf.factory('sfCommon', ['$window', function ($window) {
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
sf.factory('sfOptions', function() {
  
  // Load/Initialize options from local storage
  var opt = angular.fromJson(localStorage['sf_config'] || '{}');
    opt.prefs = opt.prefs || {};
    opt.prefs.width = opt.prefs.width || 0;
    opt.prefs.height = opt.prefs.height || 0;
    
    opt.from = opt.from || 'YYC';
    opt.to = opt.to || '';
    opt.flex = opt.flex || 0;

    opt.dep = opt.dep ? new Date(opt.dep) : new Date($.now() + 3 * 86400000);
    opt.ret = opt.ret ? new Date(opt.ret) : null;
  
  return opt;
});


/* Controllers */
var sfControllers = angular.module('sfControllers', []);

sfControllers.controller('mainController', ['$scope', '$window', '$document', 'sfOptions', function ($scope, $window, $document, sfOptions) {

    // Document/window event
    $scope.documentKeyup = function (event) {
        event.keyCode === 27 ? $window.close() : null;
    };

    angular.element($window).on('resize unload', function () {
      
      angular.extend(sfOptions.prefs, {
        width: $window.outerWidth, 
        height: $window.innerHeight,
        top: $window.screenTop,
        left: $window.screenLeft
      });
        
      localStorage['sf_config'] = angular.toJson(sfOptions);
    }); 
}]);

sfControllers.controller('searchController', ['$scope', '$window', '$document', 'sfCommon', 'sfOptions',
    function ($scope, $window, $document, sfCommon, sfOptions) {

    var wid = parseInt(sfCommon.getParameterByName('wid'));
    var tid = parseInt(sfCommon.getParameterByName('tid'));

    $scope.f_samples = $('#f_samples').html();
    $scope.l_samples = $('#l_samples').html();

    $scope.flights = [];

    $scope.outbounds = [];
    $scope.inbounds = [];

    $scope.options = sfOptions;

    // Queue holds flight searching OD and dates
    $scope.searchingQueue = [];

    // Public function for controllers
    $scope.highlight = function (flight) {
        var unsold = 40;
        for ( var i = flight.legs.length - 1; i >= 0; i--) {
            unsold = Math.min(unsold, (flight.legs[i].seatCounts || {}).unsold);
        }

        switch(true) {
            case unsold <= 5:
                return 'red';
                break;
            case unsold <= 10:
                return 'yellow';
                break;
            default:
                return 'green';
        }

    };

    $scope.clear = function () {
        $scope.outbounds = [];
        $scope.inbounds = [];
    };

    $scope.search = function () {
         var froms = this.options.from.split(/,| /);
         var tos = this.options.to.split(/,| /);
         var dep = this.options.dep;
         var ret = this.options.ret;
         var flex = this.options.flex;

        for (var i = 0; i <= flex; i ++) {
            var d = new Date(dep); d.setDate(d.getDate() + i);

            var r = 'yyyy-mm-dd', retTime = '';
            if (ret) {
              r = new Date(ret); r.setDate(r.getDate() + i);
              retTime = r.getTime();
              r = sfCommon.formatDate(r);
            }

            froms.forEach(function (from) {
                tos.forEach(function (to) {
                    $scope.searchingQueue.push({
                        'from': from,
                        'to' : to,
                        'dep' :  sfCommon.formatDate(d),
                        'depTime' : d.getTime(),
                        'ret' : r,
                        'retTime' : retTime
                    });
                });
            });
        }

        $scope.searchingQueue.push(null);

        searchFlight($scope.searchingQueue.shift());
    };

    var searchFlight = function(data) {

        $scope.currentLoading = data;

        if (!data) {
           return;
        }

        chrome.tabs.sendMessage(
           tid,
           angular.extend( {}, data, {action: 'search'}),
           function (response) {
              $scope.outbounds.push(processFlight(response, '#Leaving_base', '#Leaving-standby'));

              // Only process when returning date is not null
              if ($scope.options.ret) {
                $scope.inbounds.push(processFlight(response, '#Returning_base', '#Returning-standby'));
              }

              // Continue next search
              searchFlight($scope.searchingQueue.shift());

              $scope.$apply();
           }
        );
    };



    var processFlight = function (response, base, standby) {

        // Extract info from html
        var flightElem = $(response.message).filter('#flights');

        var flights = flightElem.find(base).find('.flight ul').map(function (i, v) {

            var flight = $(v);
            var legs = flight.find('li.flight-leg').map(function (i, v) {
                var legElem = $(v);
                var schedule = legElem.find('.col-flight-time, .col-flight-city').map(function (i, v) {
                    return $(v).text();
                }).get().join(' | ');

                var details = legElem.find('table tr.leg-detail td');
                var duration = $.trim(details.eq(1).text());
                var num = legElem.find('.col-flight-num div:first').text();
                var dep = legElem.find('.col-flight-time:first').text();
                var arr = legElem.find('.col-flight-time:last').text();
                var origin = legElem.find('.col-flight-city:first').text();
                var destination = legElem.find('.col-flight-city:last').text();

                return {
                    'num' : num,
                    'dep' : dep,
                    'arr' : arr,
                    'origin' : origin,
                    'destination' : destination,
                    'duration': duration,
                    'schedule': schedule
                }
            }).get();

            return {
                 'legs' : legs
            };
        }).get();

        var legs = flightElem.find(standby).find('.selectable-flight ul').map(function (i, v) {
            var flight = $(v);

            var keys = flight.find('li.flight-leg').map(function(i, v){
               return $(v).data('key');
            }).get();

            return [ keys ];
        }).get();


        // Merge objects
        var flattenedLegs = [];
        $.each(flights, function (index, flight) {
            $.each(flight.legs, function (ind, leg) {
                leg.key = legs[index][ind];
                flattenedLegs.push(leg);
            });
        });

        $scope.flattenedLegs = flattenedLegs;
        var len = flattenedLegs.length;
        var step = 4;
        for (var i = 0; i < len; i += step) {
            var tmp = flattenedLegs.slice(i, i + step);
            searchSeatCount($.map(tmp, function (v) {
              return v.key;
            }), tmp);
        }

        return angular.extend( {}, response, {'flights' : flights} );
    };

    var searchSeatCount = function(keys, legs) {
        chrome.tabs.sendMessage(
           tid,
           {
              //message: $scope.l_samples,
              legKeys: keys,
              action: 'count'
           },
           function (response) {
              processCount(response, legs);
              $scope.$apply();
           }
        );
    };

    var processCount = function (response, legs) {
        var legDetails = JSON.parse(response);

        for (var i = legDetails.length - 1; i >= 0; i--) {
          var ld = legDetails[i];

          for (var j = legs.length - 1; j >= 0; j--) {
            var leg = legs[j];
            if (leg.key == ld.legKey) {
              leg.seatCounts = ld.seatCounts;
            }
          };
        };
    };
}]);