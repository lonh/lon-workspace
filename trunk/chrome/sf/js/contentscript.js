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
            		    delete request.action;
            		    request['Step.From.Code'] = request.from;
            		    request['Step.To.Code'] = request.to;
            		    request['Step.Leaving'] = request.dep;
            		    request['Step.Returning'] = request.ret;

            			o.findFlights(request, sendResponse);
            			break;
                    case 'count':
                        delete request.action;
            			o.findLegs(request, sendResponse);
            			break;
            		default:
            			break;
            		}
                	return true;
                }
            );
        },

        findFlights: function (request, callback) {
            /*$.post( this.findFlightsUrl, $.extend({}, this.findFlightsData, request))
            .done(function (response) {
                callback({message: response, 'from': request.from, 'to': request.to, 'dep': request.dep});
            });*/
            
            callback({message: request.message, 'from': request.from, 'to': request.to, 'dep': request.dep});
        },

        findLegs: function (request, callback) {

            /*$.ajax ({
                url: this.findLegUrl,
                type: "POST",
                data: JSON.stringify($.extend({}, this.findLegData, request)),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function(response){
                    callback(response);
                }
            });*/
            callback(request.message);
        }
    });


    // Test post
    /*var leg = {
        "reference":"b2d0c9ee-9622-4da1-962d-e92e56377dda",
        "legKeys[]":["5859d8be-27f8-422d-90c9-432716caf823","d4b0e869-c285-4c5b-a40a-f8d8fbc3343a","6d6cf4c3-92f1-46fb-a5e1-f76b30460f97"]
    };
    */
    /*
    $.post( 'Async/GetSeatCounts', leg)
    .done(function (response) {
        $('body').append(response);
    });
    */

    new _.SF();

    console.log("End of initialize SF, everything seems fine!");

})(window, document, jQuery, sf);