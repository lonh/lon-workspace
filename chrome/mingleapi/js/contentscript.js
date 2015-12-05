/*
    Content script running inside web page context
*/

window.ma = window.ma || {};

(function (w, d, $, _){

    if (_.MA) return true;

    _.MA = function () {
        this.initialize();
    };

    // 'Class' Properties
    $.extend(_.MA.prototype, {});

    // Prototype properties
    $.extend(_.MA.prototype, {

        // Variables
        urlCreate: "/api/v2/projects/westjet_vacations_maintenance/cards/1278.xml",
        cardNumber: null,



        initialize: function () {
            this.cardNumber = $('[data-card-number]').attr('data-card-number');

            this.initializeListener();
        },

        initializeListener: function () {
            var o = this;
            chrome.extension.onMessage.addListener(
                function(request, sender, sendResponse) {
                	switch (request.action) {
            		case 'search':
            			
            			break;
                    case 'create':
                        delete request.action;
            			o.create(request, sendResponse);
            			break;
                    default:
            			break;
            		}
                	return true;
                }
            );
        },

        create: function (request, callback) {
            //card[name]=testing card creation
            //card[card_type_name]=story
            var o = this;
            var card = request['card'];
            var request = {                                
                'card[name]': card.name,
                'card[description]': card.description
            };
            
            $.ajaxSetup({async: false});
            $.ajax({ 
                url: o.urlCreate,
                type: 'PUT',
                data: request,
                success: function (response, status, jqxOrError) {
                    callback($.extend({message: response, 'status' : status}, request));
                }
            });
            $.ajaxSetup({async: true});
        }
    });

    new _.MA();

    console.log("End of initialize MA, everything seems fine!");

})(window, document, jQuery, ma);