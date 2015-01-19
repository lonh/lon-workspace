'use strict';

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

    $scope.from = 'YYC';
    $scope.to = 'YYZ';
    $scope.dep = new Date($.now() + 1 * 24 * 60 * 60 * 1000);
    $scope.ret = new Date($.now() + 5 * 24 * 60 * 60 * 1000);

    $scope.search = function() {
        var depVal = $scope.dep.toISOString().replace(/T.*$/, '');
        var retVal = $scope.ret.toISOString().replace(/T.*$/, '');

        chrome.tabs.sendMessage(
           tid,
           {
              from : $scope.from,
              to : $scope.to,
              dep : depVal,
              ret : retVal,
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
        var flightElem = $(response).filter('#flights');

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

        $scope.flights = flights;
    };

    $scope.processCount = function (response) {
        $scope.count = response;
    };
}]);