'use strict';

window.sf_throttle = 300;

/* Shared Data/Services */
sf.factory('sfCommon', ['$window', function ($window) {
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



/* Controllers */
var sfControllers = angular.module('sfControllers', []);

sfControllers.controller('mainController', ['$scope', '$window', '$document', function ($scope, $window, $document) {

    // ESC to close
    angular.element($document).on('keyup', function(event) {
        event.keyCode === 27 ? $window.close() : null;
    });

    // Document/window event
    $scope.documentKeyUp = function (event) {
        event.keyCode === 27 ? $window.close() : null;
    };
}]);

sfControllers.controller('searchController', ['$scope', '$window', '$document', '$sce', 'sfCommon', function ($scope, $window, $document, $sce, $sfCommon) {

    var wid = parseInt($sfCommon.getParameterByName('wid'));
    var tid = parseInt($sfCommon.getParameterByName('tid'));

    $scope.f_samples = $('#f_samples').html();
    $scope.l_samples = $('#l_samples').html();

    $scope.flights = [];

    $scope.outbounds = [];
    $scope.inbounds = [];

    $scope.from = 'YYC';
    $scope.to = 'YYZ';

    var dt1 = new Date(); dt1.setDate(dt1.getDate() + 1); 
    var dt2 = new Date(); dt2.setDate(dt2.getDate() + 7); 

    $scope.dep = dt1;
    $scope.ret = dt2
    $scope.flex = 0;

    $scope.search = function () {

        var froms = $scope.from.split(',');
        var tos = $scope.to.split(',');
        var flex = $scope.flex;

        // Process outbound
        $scope.loopOD(froms, tos, $scope.dep, $scope.ret, 1);
    };


    $scope.loopOD = function ($froms, $tos, $dep, $ret, $count) {
      $froms.forEach(function (from) {
            $tos.forEach(function (to) {
               for (var i = -$scope.flex; i <= $scope.flex; i ++) {
                var dep = new Date($dep); dep.setDate(dep.getDate() + i);
                dep = dep.toISOString().replace(/T.*$/, '');

                var ret = new Date($ret); ret.setDate(ret.getDate() + i);
                ret = ret.toISOString().replace(/T.*$/, '');

                (function ($f, $t, $d, $r) {
                  $window.setTimeout(function () {
                    $scope.searchFlight($f, $t, $d, $r);
                  }, $window.sf_throttle * $count);

                })(from , to, dep, ret);

                $count ++;
               }
            });
        });

      return $count;
    };


    $scope.searchFlight = function(from, to, dep, ret) {

        chrome.tabs.sendMessage(
           tid,
           {
              message: $scope.f_samples,
              'from' : from,
              'to' : to,
              'dep' : dep,
              'ret' : ret,
              action: 'search'
           },
           function (response) {
              $scope.processFlight(response);
              $scope.$apply();
           }
        );
    };

    $scope.count = function(keys) {
        chrome.tabs.sendMessage(
           tid,
           {
              message: $scope.l_samples,
              legKeys:keys,
              action: 'count'
           },
           function (response) {
              $scope.processCount(response);
              $scope.$apply();
           }
        );
    };


    $scope.processFlight = function (response) {
        //$scope.response = $sce.trustAsHtml(response);

        // Extract info from html
        var flightElem = $(response.message).filter('#flights');

        var flights = flightElem.find('#Leaving_base').find('.flight ul').map(function (i, v) {

            var flight = $(v);
            var legs = flight.find('li.flight-leg').map(function (i, v) {
                var legElem = $(v);
                var schedule = legElem.find('.col-flight-time, .col-flight-city').map(function (i, v) {
                    return $(v).text();
                }).get().join(' | ');

                var details = legElem.find('table tr.leg-detail td');
                var num = $.trim(details.eq(3).text());
                var duration = $.trim(details.eq(1).text());

                return {
                    'num' : num,
                    'duration': duration,
                    'schedule': schedule
                }
            }).get();

            return {
                 'legs' : legs
            };
        }).get();

        var legs = flightElem.find('#Leaving-standby').find('.selectable-flight ul').map(function (i, v) {
            var flight = $(v);

            var keys = flight.find('li.flight-leg').map(function(i, v){
               return $(v).data('key');
            }).get();

            return [ keys ];
        }).get();

        // Get seat count
        var flattedLegs = $.map(legs, function (leg) {
            return leg;
        });

        // Merge objects
        $.each(flights, function (index, flight) {
            $.each(flight.legs, function (ind, leg) {
                leg.key = legs[index][ind];
            });
        });

        //$scope.flights =  $scope.flights.concat(flights);

        $scope.outbounds.push({
          'from' : response.from,
          'to' : response.to,
          'dep' : response.dep,
          'ret': response.ret,
          'flights' : flights
        });
    };

    $scope.processCount = function (response) {
        $scope.count = response;
    };
}]);