/*
    Content script running inside web page context
*/

window.sf = window.sf || {};

(function (w, d, $, _){

    if (_.SF) return true;

    _.SF = function () {
        this.initialize();
    };

    // 'Class' Properties
    $.extend(_.SF.prototype, {});

    // Prototype properties
    $.extend(_.SF.prototype, {

        // Variables
        reference: null,
        findFlightsUrl: null,
        findLegUrl: '/Async/GetSeatCounts',
        findAirportsUrl: '/Airports/For',

        findFlightsData: {
            'Step.From.Code': 'YYC',
            'Step.From.Name': 'Calgary, AB (YYC)',
            'Step.To.Code': 'MBJ',
            'Step.To.Name': 'Montego Bay, Jamaica (MBJ)',
            'Step.Leaving': '2015-01-18',
            'Step.Returning': '2015-01-24',
            'Step.NumberOfGuestsSpecified': '1',
            'Step.IsPort': false,
            'Step.Type': 'Standby',
            'Reference': ''
        },

        findLegData: {
            "reference":"",
            "legKeys":[]
        },

        initialize: function () {
            var form = $('#step-1 form');
            this.findFlightsUrl = form.attr('action');
            this.findFlightsData.Reference = this.findLegData.reference = form.find(':input[name=Reference]').val();

            this.initializeListener();
        },

        initializeListener: function () {
            var o = this;
            chrome.extension.onMessage.addListener(
                function(request, sender, sendResponse) {
                	switch (request.action) {
            		case 'search':
            			o.findFlights(request, sendResponse);
            			break;
                    case 'count':
                        delete request.action;
            			o.findLegs(request, sendResponse);
            			break;
                    case 'airports':
            			o.findAirports(request, sendResponse);
            			break;
                    case 'lookup':
                        o.lookupFlights(request, sendResponse);
                        break;
            		default:
            			break;
            		}
                	return true;
                }
            );
        },

        lookupFlights: function (request, callback) {            
            $('input[name*="Step.From"]').val(request.from);
            $('input[name*="Step.To"]').val(request.to);
            $('input[name="Step.Leaving"]').val(request.dep);
            request.ret ? $('input[name="Step.Returning"]').val(request.ret) : null;
            $('span:contains(Search)').click()            
        },


        findFlights: function (request, callback) {
            if (request.message) {
                callback(request);
                return;
            }

            var flightRequest = $.extend({}, this.findFlightsData);
            flightRequest['Step.From.Code'] = request.from;
            flightRequest['Step.To.Code'] = request.to;
            flightRequest['Step.Leaving'] = request.dep;
            flightRequest['Step.Returning'] = request.ret;

            $.ajaxSetup({async: false});
            $.post( this.findFlightsUrl, flightRequest)
            .always(function (response, status, jqxOrError) {
                callback($.extend({message: response, 'status' : status}, request));
            });
            $.ajaxSetup({async: true});
        },

        findLegs: function (request, callback) {
            if (request.message) {
                callback(request);
                return;
            }

            var findLegRequest = $.extend({}, this.findLegData);
            findLegRequest['legKeys'] = request.legKeys;

            $.ajaxSetup({async: false});
            $.ajax ({
                url: this.findLegUrl,
                type: "POST",
                data: JSON.stringify(findLegRequest),
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            }).always(function(response, status, jqxOrError) {
                callback($.extend({message: response, 'status' : status}, findLegRequest));
            });
            $.ajaxSetup({async: true});
        },

        findAirports: function (request, callback) {
            $.ajaxSetup({async: false});
            $.ajax ({
                url: this.findAirportsUrl,
                type: "GET",
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            }).always(function (response, status, jqxOrError) {
                callback($.extend({message: response, 'status' : status}, request));
            });
            $.ajaxSetup({async: true});
        }
    });

    new _.SF();

    console.log("End of initialize SF, everything seems fine!");

})(window, document, jQuery, sf);