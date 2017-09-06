$(document).ready(function() {

    var TourOverlayView = Backbone.View.extend({

        el: '#switchtour',

        parentElement: $('.full-content'),

        appTemplate: _.template(
            '<div id="switchtour-overlay-div">' +
                '<div id="switchtour-qa-div">Please select:' +
                    '<div id="switchtour-form-div"></div>' +
                    '<button id="switchtour-submit-btn">Submit</button>' +
                '</div>' +
            '</div>' 
        ),

        formTemplate: _.template(
            '<input type="radio" name="switchtour-select-in" value="<%= formvalue %>"><%= formvalue %><br>'
        ),

        mastheadTemplate: _.template(
            '<div id="switchtour-masthead-div"></div>'
        ),

        btnTemplate: _.template(
            '<button id="switchtour-masthead-btn"><%= btntext %></button>'
        ),

        events: {
            'click #switchtour-masthead-btn': 'invokeOverlay'
        },

        initialize: function () {
            this.render();
            this.registerEvents();
            this.switchtour = {btntext: 'close'};
            this.renderBtn();
            this.invokeOverlay();
        },

        render: function() {
            this.parentElement.prepend(this.appTemplate());
            this.$el.html(this.mastheadTemplate());

            this.$overlayDiv = $('#switchtour-overlay-div');
            this.$mastheadDiv = $('#switchtour-masthead-div');
            this.$formDiv = $('#switchtour-form-div');
            this.$submitBtn = $('#switchtour-submit-btn');
        },

        renderBtn: function() {
            this.$mastheadDiv.html(this.btnTemplate({btntext: this.switchtour.btntext}));
        },

        renderForm: function (values) {
            console.log(values);
            console.log(values.length);
            var self = this;
            var o = '';
            $.each(values, function() {
                o = o.concat(self.formTemplate({formvalue: this}));
            });
            self.$formDiv.html(o);
            self.$selectIn = $("input[name='switchtour-select-in']");
        },

        invokeOverlay: function() {
            var self = this;
            if (this.switchtour.btntext == 'close'){
                self.switchtour = {btntext: 'open'};    
                self.removeOverlay();
            } else {
                self.switchtour = {btntext: 'close'};
                self.showOverlay();
            }
            self.renderBtn();
        },

        runSelection: function (){
            var value = this.$selectIn.filter(':checked').val();
            if(value){
                this.$selectIn.prop('checked', false);
                this.switchtour = {btntext: 'close'};
                this.invokeOverlay();
                giveTour(value);
            }
        },

        registerEvents: function() {
            var self = this;
            this.parentElement.on('keydown',function(e) {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    self.switchtour = {btntext: 'close'};
                    self.invokeOverlay();
                }
            });

            this.$overlayDiv.on('click',function(e){
                e.stopPropagation();
            });

            this.$submitBtn.on('click',function(e){
                e.stopPropagation();
                self.runSelection();
            });
        },

        showOverlay: function() {
            $('#switchtour-overlay-div').show();
            $('#left').css('filter', 'blur(5px)');
            $('#center').css('filter', 'blur(5px)');
            $('#right').css('filter', 'blur(5px)');
        },

        /** Remove the search overlay */
        removeOverlay: function() {
            $('#switchtour-overlay-div').hide();
            $('#left').css('filter', 'none');
            $('#center').css('filter', 'none');
            $('#right').css('filter', 'none');
        },

    });

    var tour_opts = { 
        storage: window.sessionStorage,

        onEnd: function(){
            sessionStorage.removeItem('activeGalaxyTour');
        },

        delay: 150,

        orphan: true,

        onNext: function(){
            if (tour.getCurrentStep() == 0){
                tour.end();
                startTour();
            }
        }
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
            tourOverlay.renderForm(items);
            tourOverlay.invokeOverlay();
        });
    }

    var gxy_root = typeof Galaxy === "undefined" ? '/' : Galaxy.root;
    var tour;
    var tourOverlay = new TourOverlayView();
    startTour();
});
