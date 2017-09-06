$(document).ready(function() {

    var TourView = Backbone.View.extend({

        el: '#runtour',

        appTemplate: _.template(
            '<div id="runtour-header">' +
                'started...' +
            '</div>'
        ),

        initialize: function() {
            var self = this;
            this.render();
        },

        render: function() {
            this.$el.html(this.appTemplate());
            return this;
        },

    });

    var tour_opts = { 
        storage: window.sessionStorage,

        onEnd: function(){
            sessionStorage.removeItem('activeGalaxyTour');
        },

        delay: 150,

        orphan: true,

        // onNext: function(){
        // }
    };

    var hooked_tour_from_data = function(data){
        _.each(data.steps, function(step) {
            if (step.preclick){
                step.onShow = function(){
                    _.each(step.preclick, function(preclick){
                        $(preclick).click();
                    });
                };
            }
            if (step.postclick){
                step.onHide = function(){
                    _.each(step.postclick, function(postclick){
                        $(postclick).click();
                    });
                };
            }
            if (step.textinsert){
                step.onShown= function(){
                    $(step.element).val(step.textinsert).trigger("change");
                };
            }
        });
        return data;
    };

    var giveTour = function(tour_id){
        var url = gxy_root + 'api/tours/' + tour_id;
        $.getJSON( url, function( data ) {
            var tourdata = hooked_tour_from_data(data);
            sessionStorage.setItem('activeGalaxyTour', JSON.stringify(data));
            tour = new Tour(_.extend({
                steps: tourdata.steps,
            }, tour_opts));
            tour.init();
            tour.goTo(0);
            tour.restart();
        });
    };

    var startTour = function(){
        var url = gxy_root + 'api/tours/';
        $.getJSON(url, function(data) {
            var items = [];
            for(var i in data) {
                items.push(data[i].id);
            }
            view.renderForm(items);
        });
    }

    var gxy_root = typeof Galaxy === "undefined" ? '/' : Galaxy.root;
    var tour;
    giveTour('test');
    var view = new TourView();
    startTour();
});
