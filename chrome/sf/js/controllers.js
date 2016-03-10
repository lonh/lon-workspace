'use strict';

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
    
    opt.from = opt.from || ['YYC'];
    opt.to = opt.to || [];
    opt.flex = opt.flex || 0;

    opt.dep = opt.dep ? new Date(opt.dep) : new Date($.now() + 3 * 86400000);
    opt.ret = opt.ret ? new Date(opt.ret) : null;
    
    opt.histories = opt.histories || [];

    opt.outbounds = opt.outbounds || {};
    opt.inbounds = opt.inbounds || {};

  return opt;
});

/* Controllers */
//var sfControllers = angular.module('sfControllers', []);

sf.constant('countryStateNames', {
  'AB' : 'Alberta',
  'BC' : 'British Columbia',
  'MB' : 'Manitoba',
  'NB' : 'New Brunswick',
  'NL' : 'Newfoundland and Labrador',
  'NT' : 'Northwest Territories',
  'NS' : 'Nova Scotia',
  'NU' : 'Nunavu',
  'ON' : 'Ontario',
  'PE' : 'Prince Edward Island',
  'QC' : 'Québe',
  'SK' : 'Saskatchewan',
  'YT' : 'Yukon Territory',

  'AL' : 'Alabama',
  'AK' : 'Alaska',
  'AZ' : 'Arizona',
  'AR' : 'Arkansas',
  'AS' : 'American Samoa',
  'CA' : 'California',
  'CO' : 'Colorado',
  'CT' : 'Connecticut',
  'DE' : 'Delaware',
  'DC' : 'District of Columbia',
  'FM' : 'Fed. States of Micronesia',
  'FL' : 'Florida',
  'GA' : 'Georgia',
  'GU' : 'Guam',
  'HI' : 'Hawaii',
  'ID' : 'Idaho',
  'IL' : 'Illinois',
  'IN' : 'Indiana',
  'IA' : 'Iowa',
  'KS' : 'Kansas',
  'KY' : 'Kentucky',
  'LA' : 'Louisiana',
  'ME' : 'Maine',
  'MD' : 'Maryland',
  'MH' : 'Marshall Islands',
  'MA' : 'Massachusetts',
  'MI' : 'Michigan',
  'MN' : 'Minnesota',
  'MS' : 'Mississippi',
  'MO' : 'Missouri',
  'MT' : 'Montana',
  'NE' : 'Nebraska',
  'NV' : 'Nevada',
  'NH' : 'New Hampshire',
  'NJ' : 'New Jersey',
  'NM' : 'New Mexico',
  'NY' : 'New York',
  'NC' : 'North Carolina',
  'ND' : 'North Dakota',
  'MP' : 'Northern Marianas',
  'OH' : 'Ohio',
  'OK' : 'Oklahoma',
  'OR' : 'Oregon',
  'PA' : 'Pennsylvania',
  'PR' : 'Puerto Rico',
  'RI' : 'Rhode Island',
  'SC' : 'South Carolina',
  'SD' : 'South Dakota',
  'TN' : 'Tennessee',
  'TX' : 'Texas',
  'UT' : 'Utah',
  'VT' : 'Vermont',
  'VA' : 'Virginia',
  'VI' : '(U.S.) Virgin Islands',
  'WA' : 'Washington',
  'WV' : 'West Virginia',
  'WI' : 'Wisconsin',
  'WY' : 'Wyoming',
  'AA' : 'Armed Forces, the Americas  ',
  'AE' : 'Armed Forces, Europe',
  'AP' : 'Armed Forces, Pacific'

});

sf.controller('mainController', ['$scope', '$window', '$document', '$timeout', 'sfOptions',  
  function ($scope, $window, $document, $timeout, sfOptions) {

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

sf.controller('searchController', ['$scope', '$window', '$document', '$timeout', 'sfCommon', 'sfOptions', 'countryStateNames',
    function ($scope, $window, $document, $timeout, sfCommon, sfOptions, countryStateNames) {

    var wid = parseInt(sfCommon.getParameterByName('wid'));
    var tid = parseInt(sfCommon.getParameterByName('tid'));

    //$scope.f_samples = $('#f_samples').html();
    //$scope.l_samples = $('#l_samples').html();

    $scope.options = sfOptions;

    //$scope.outbounds = {};
    //$scope.inbounds = {};
    $scope.airports = [];

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
            case unsold <= 19:
                return 'yellow';
                break;
            default:
                return 'green';
        }

    };

    $scope.isEmptySearch = function () {
        return $.isEmptyObject(this.options.inbounds) && $.isEmptyObject(this.options.outbounds);
    };

    $scope.readyToSearch = function () {
        return $scope.airports.length && // Got airports
               !$scope.currentLoading && // Not in loading
               $scope.options.from && $scope.options.from.length && $scope.options.to && $scope.options.to.length && $scope.options.dep; // have from, to and departure date
    }

    $scope.clear = function () {
        this.options.outbounds = {};
        this.options.inbounds = {};
    };

    $scope.reset = function () {
        this.options.from = [];
        this.options.to = [];

        this.options.dep = null;
        this.options.ret = null
        this.options.flex = 0;
        this.options.outbounds = {};
        this.options.inbounds = {};
    };

    $scope.objectKeys = function(obj){
      return Object.keys(obj).sort();
    }

    $scope.toggleGroup = function (group) {      
      var show = group.show;
      for (var i = $scope.groups.length - 1; i >= 0; i--) {
        $scope.groups[i].show = false;
      }

      group.show = !show;
    };

    $scope.clickRoute = function (dt, route) {
      console.log(route);
      chrome.tabs.sendMessage(
            tid,
            angular.extend( {}, route, {action: 'lookup'})
        );
    };

    $scope.addToHistory = function (search) {
      var index = $scope.options.histories.findIndex(function ($elem, $index, $array) {
        return $elem.from.join() == search.from.join()
          && $elem.to.join() == search.to.join()
          && ($elem.dep == search.dep || $elem.dep == search.dep.toJSON())
          && $elem.flex == search.flex
          && ($elem.ret == search.ret || $elem.ret == search.ret.toJSON());
      });
      
      index == -1 ? $scope.options.histories.push(search) : null;
    };

    $scope.applyHistory = function ($index) {
        var his = $scope.options.histories[$index];

        $scope.options.from = his.from;
        $scope.options.to = his.to;
        $scope.options.dep = new Date(his.dep);
        $scope.options.ret = his.ret == null ? null : new Date(his.ret);
        $scope.options.flex = his.flex;
    };

    $scope.removeHistory = function ($index) {
      $scope.options.histories.splice($index, 1);
      $scope.$apply();
    };

    $scope.formatAirports = function (airports, label) {
        if (airports && airports.length != 0) {
          return airports.join(', ');
        } else {
          return label;
        }
    }

    $scope.cancelSearch = function () {
      this.currentLoading = null;
      this.searchingQueue.length = 0;      
    };

    $scope.search = function () {
        var froms = this.options.from;
        var tos = this.options.to;

        var dep = this.options.dep;
        var ret = this.options.ret;
        var flex = this.options.flex;

        $scope.addToHistory({
          from: froms,
          to: tos,
          dep: dep,
          ret: ret,
          flex: flex
        });

        for (var i = - flex; i <= flex; i ++) {
            var d = new Date(dep); d.setDate(d.getDate() + i);

            var r = 'yyyy-mm-dd', retTime = '';
            if (ret) {
              r = new Date(ret); r.setDate(r.getDate() + i);
              retTime = r.getTime();
              r = sfCommon.formatDate(r);
            }

            froms.forEach(function (from) {
                tos.forEach(function (to) {

                    if (from !== to) {
                      $scope.searchingQueue.push({
                        'from': from,
                        'to' : to,
                        'dep' :  sfCommon.formatDate(d),
                        'depTime' : d.getTime(),
                        'ret' : r,
                        'retTime' : retTime
                      });
                    }
                });
            });
        }

        this.searchingQueue.push(null);
        this.searchingLength = this.searchingQueue.length;

        searchFlight(this.searchingQueue.shift());
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

                var opts = $scope.options;

                if (response) {
                    !opts.outbounds[response.depTime] ? opts.outbounds[response.depTime] = [] : null;
                    insertFlights(opts.outbounds[response.depTime], processFlight(response, '#Leaving_base', '#Leaving-standby'));

                    // Only process when returning date is not null                
                    if ($scope.options.ret) {
                        !opts.inbounds[response.retTime] ? opts.inbounds[response.retTime] = [] : null;
                        insertFlights(opts.inbounds[response.retTime], processFlight(response, '#Returning_base', '#Returning-standby'));
                    }
                }

                // Continue next search
                searchFlight($scope.searchingQueue.shift());
                $scope.$apply();
           }
        );
    };

    var insertFlights = function (bound, flights) {
      flights.message = null;

      var index = bound.findIndex(function(flt) {
        return flights.from == flt.from && flights.to == flt.to;
      });
      index != -1 ? bound[index] = flights : bound.push(flights);
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
                var origin = legElem.find('.col-flight-city:first').text().split(/[()]/);
                var destination = legElem.find('.col-flight-city:last').text().split(/[()]/);

                return {
                    'num' : num,
                    'dep' : dep,
                    'arr' : arr,
                    'origin' : origin[1],
                    'originName' : origin[0],
                    'destination' : destination[1],
                    'destinationName' : destination[0],
                    'duration': duration,
                    'schedule': schedule
                }
            }).get();

            return {'legs' : legs};

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
              response && response.status == 'success' && processCount(response.message, legs);
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

    var processAirports = function (response) {
        $scope.airports = JSON.parse(response);

        var groups = [];
        for (var i = 0, l = $scope.airports.length; i < l; i++) {
            var airport = $scope.airports[i];

            var has = groups.some(function (group) {
                return group.country == airport.country && group.provinceState == airport.provinceState;
            });

            if (!has) {
                groups.push(setCountryDisplayName(airport));
            }
        }

        groups.sort(function (a, b) {
            var r = a.country.localeCompare(b.country);
            return r == 0 ? a.provinceState.localeCompare(b.provinceState) : r;
        });

        $scope.groups = groups;
    };

    var setCountryDisplayName = function (airport) {

      var provinceStateCountryName = countryStateNames[airport.provinceState];

      airport.countryStateDisplay = provinceStateCountryName ? provinceStateCountryName + ', ' + airport.country : 
        (airport.provinceState ? airport.provinceState + ', ' : '') + airport.country;
      return airport;
    }

    $timeout(function() {
        chrome.tabs.sendMessage(
           tid,
           {
            action: 'airports'
           },
           function (response) {
              response && response.status == 'success' && processAirports(response.message);
              $scope.$apply();
           }
        );
    }, 2000);

}]);