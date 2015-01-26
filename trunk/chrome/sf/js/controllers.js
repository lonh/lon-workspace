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

    // ESC to close
    angular.element($document).on('keyup', function(event) {
        event.keyCode === 27 ? $window.close() : null;
    });

    // Document/window event
    $scope.documentKeyUp = function (event) {
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

    $scope.searchingQueue = [];
    $scope.searchingFlag = false;

    // Public function for controllers
    $scope.search = function () {
         var froms = this.options.from.split(',');
         var tos = this.options.to.split(',');
         var dep = this.options.dep;
         var ret = this.options.ret;
         var flex = this.options.flex;

        froms.forEach(function (from) {
            tos.forEach(function (to) {
               for (var i = -flex; i <= flex; i ++) {
                var d = new Date(dep); d.setDate(d.getDate() + i); d = sfCommon.formatDate(d);

                var r = 'yyyy-mm-dd';
                if (ret) {
                  r = new Date(ret); r.setDate(r.getDate() + i); r = sfCommon.formatDate(ret);
                }

                $scope.searchingQueue.push({
                    'from': from,
                    'to' : to,
                    'dep' : d,
                    'ret' : r
                });

               }
            });
        });

        searchFlight($scope.searchingQueue.shift());

        /*loopOD(
          this.options.from.split(','),
          this.options.to.split(','),
          this.options.dep,
          this.options.ret,
          this.options.flex,
          1);*/
    };

    var loopOD = function ($froms, $tos, $dep, $ret, $flex, $count) {
      $froms.forEach(function (from) {
            $tos.forEach(function (to) {
               for (var i = -$flex; i <= $flex; i ++) {
                var dep = new Date($dep); dep.setDate(dep.getDate() + i);
                dep = sfCommon.formatDate(dep);

                var ret = 'yyyy-mm-dd';
                if ($ret) {
                  ret = new Date($ret); ret.setDate(ret.getDate() + i); 
                  ret = sfCommon.formatDate(ret);
                }


                (function ($f, $t, $d, $r) {
                  $window.setTimeout(function () {
                    searchFlight($f, $t, $d, $r);
                  }, $window.sf_throttle * $count);

                })(from, to, dep, ret);

                $count ++;
               }
            });
        });

      return $count;
    };


    var searchFlight = function(data) {

        chrome.tabs.sendMessage(
           tid,
           {
              message: $scope.f_samples,
              'from' : data.from,
              'to' : data.to,
              'dep' : data.dep,
              'ret' : data.ret,
              action: 'search'
           },
           function (response) {
              processFlight(response);
              $scope.$apply();

              if ($scope.searchingQueue.length != 0) {
                searchFlight($scope.searchingQueue.shift());
              }
           }
        );
    };



    var processFlight = function (response) {

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

        var legs = flightElem.find('#Leaving-standby').find('.selectable-flight ul').map(function (i, v) {
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

        // Get seat count
        // var flattenedLegs = $.map(legs, function (leg) {
        //     return leg;
        // });

        $scope.flattenedLegs = flattenedLegs;
        var len = flattenedLegs.length;
        var step = 4;
        for (var i = 0; i < len; i += step) {
            var tmp = flattenedLegs.slice(i, i + step);
            searchSeatCount($.map(tmp, function (v) {
              return v.key;
            }), tmp);
        }

        $scope.outbounds.push({
            'from' : response.from,
            'to' : response.to,
            'dep' : response.dep,
            'ret': response.ret,
            'flights' : flights
        });
    };

    var searchSeatCount = function(keys, legs) {
        chrome.tabs.sendMessage(
           tid,
           {
              message: $scope.l_samples,
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