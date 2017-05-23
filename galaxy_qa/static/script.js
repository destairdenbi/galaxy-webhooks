$(document).ready(function() {

	var gxy_root = typeof Galaxy === "undefined" ? '/' : Galaxy.root;
	
	var tour_opts = { storage: window.sessionStorage,
                      onEnd: function(){
                          sessionStorage.removeItem('activeGalaxyTour');
                      },
                      delay: 150, // Attempts to make it look natural
                      orphan:true
    };

    var tour = new Tour();

    var hooked_tour_from_data = function(data){
        _.each(data.steps, function(step) {
            if (step.preclick){
                step.onShow= function(){
                    _.each(step.preclick, function(preclick){
                        // TODO: click delay between clicks
                        $(preclick).click();
                    });
                };
            }
            if (step.postclick){
                step.onHide = function(){
                    _.each(step.postclick, function(postclick){
                        // TODO: click delay between clicks
                        $(postclick).click();
                    });
                };
            }
            if (step.textinsert){
                // Have to manually trigger a change here, for some
                // elements which have additional logic, like the
                // upload input box
                step.onShown= function(){
                    $(step.element).val(step.textinsert).trigger("change");
                };
            }
            if (step.exit){
            	tour.end();
            }
        });
        return data;
    };

    var giveTour = function(tour_id){
        var url = gxy_root + 'api/tours/' + tour_id;
        $.getJSON( url, function( data ) {
            // Set hooks for additional click and data entry actions.

            var tourdata = hooked_tour_from_data(data);
            sessionStorage.setItem('activeGalaxyTour', JSON.stringify(data));
            // Store tour steps in sessionStorage to easily persist w/o hackery.
            tour = new Tour(_.extend({
                steps: tourdata.steps,
            }, tour_opts));
            // Always clean restart, since this is a new, explicit giveTour execution.
            tour.init();
            tour.goTo(0);
            tour.restart();
        });
    };

    giveTour("core.galaxy_ui");
});