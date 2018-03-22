$(document).ready(function() {

    var TourOverlayView = Backbone.View.extend({

        el: '#switchtour',

        parentElement: $('.full-content'),

        appTemplate: _.template(
            '<div id="switchtour-overlay-div">' +
                '<div id="switchtour-qa-div">' +
                    '<div id="switchtour-text-div"></div>' +
                    '<div id="switchtour-form-div"></div>' +
                    '<button id="switchtour-submit-btn">Submit</button>' +
                    '<br><br>' +
                    '<b>Download current</b>' +
                    '<br>' +
                    '<button id="download-wf-btn">Workflow</button>' +
                    '&nbsp' +
                    '<button id="download-cmd-btn">Commands</button>' +
                '</div>' +
            '</div>' 
        ),

        formTemplate: _.template(
            '<input type="radio" name="switchtour-select-in" value="<%= formvalue %>"><%= formdescription %><br>'
        ),

        textTemplate: _.template(
            '<b> <%= text1 %> </b><br> <%= text2 %>'
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
            var self = this;
            var url = gxy_root + 'api/webhooks/switchtour/get_data';
            $.getJSON(url, function(data) {
                if (data.success) {
                    self.render();
                    self.registerEvents();
                    startTour();
                } else {
                    alert("Please login first");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                    return
                }
            });
            
        },

        render: function() {
            this.parentElement.prepend(this.appTemplate());
            this.$el.html(this.mastheadTemplate());

            this.$overlayDiv = $('#switchtour-overlay-div');
            this.$mastheadDiv = $('#switchtour-masthead-div');
            this.$formDiv = $('#switchtour-form-div');
            this.$textDiv = $('#switchtour-text-div');
            this.$submitBtn = $('#switchtour-submit-btn');
            this.$downloadWFbtn = $('#download-wf-btn');
            this.$downloadCMDbtn = $('#download-cmd-btn');
        },

        renderBtn: function() {
            this.$mastheadDiv.html(this.btnTemplate({btntext: this.switchtour.btntext}));
        },

        renderForm: function (values, descriptions) {
            var self = this;
            var o = '';
            for (var i = 0; i < values.length; i++) {
                o = o.concat(self.formTemplate({formvalue: values[i], formdescription: descriptions[i]}));
            }
            self.$formDiv.html(o);
            if (! o) {
                self.$submitBtn.hide();
            }
            self.$selectIn = $("input[name='switchtour-select-in']");
        },

        renderText: function (text1,text2) {
            this.$textDiv.html(this.textTemplate({text1: text1, text2: text2}));
        },

        invokeOverlay: function() {
            var self = this;
            if (this.switchtour.btntext == 'end'){
                if (typeof tour !== 'undefined' && ! tour.ended()) {
                    tour.end();
                } else {
                    self.switchtour = {btntext: 'restart'};
                    self.removeOverlay();
                    self.renderBtn();
                }
            } else {
                self.switchtour = {btntext: 'end'};
                self.showOverlay();
                self.renderBtn();
            }
        },

        runSelection: function (){
            var value = this.$selectIn.filter(':checked').val();
            if(value){
                this.$selectIn.prop('checked', false);
                this.removeOverlay();
                giveTour(value);
            }
        },

        downloadString: function(data) {
            blob = new Blob([data], {type: "application/octet-stream"});
            var e = document.createElement("a");
            document.body.appendChild(e);
            e.href = window.URL.createObjectURL(blob);
            e.click();
            document.body.removeChild(a);
        },

        downloadJson: function(data) {
            blob = new Blob([JSON.stringify(data)], {type: "application/octet-stream"});
            var e = document.createElement("a");
            document.body.appendChild(e);
            e.href = window.URL.createObjectURL(blob);
            e.click();
            document.body.removeChild(a);
        },

        registerEvents: function() {
            var self = this;
            this.parentElement.on('keydown',function(e) {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    self.switchtour = {btntext: 'restart'};
                    self.renderBtn();
                    self.removeOverlay();
                }
            });

            this.$submitBtn.on('click',function(e){
                e.stopPropagation();
                self.runSelection();
            });

            this.$downloadWFbtn.on('click',function(e){
                e.stopPropagation();
                self.downloadJson(workflow);
            });

            this.$downloadCMDbtn.on('click',function(e){
                e.stopPropagation();
                self.downloadString(commands);
            });
        },

        showOverlay: function() {
            $('#switchtour-overlay-div').show();
            $('#left').css('filter', 'blur(5px)');
            $('#left').css('pointer-events', 'none');
            $('#center').css('filter', 'blur(5px)');
            $('#center').css('pointer-events', 'none');
            $('#right').css('filter', 'blur(5px)');
            $('#right').css('pointer-events', 'none');
        },

        /** Remove the search overlay */
        removeOverlay: function() {
            $('#switchtour-overlay-div').hide();
            $('#left').css('filter', 'none');
            $('#left').css('pointer-events', 'auto');
            $('#center').css('filter', 'none');
            $('#center').css('pointer-events', 'auto');
            $('#right').css('filter', 'none');
            $('#right').css('pointer-events', 'auto');
        },

    });

    var tour_opts = { 
        storage: window.sessionStorage,

        onEnd: function(){
            sessionStorage.removeItem('activeGalaxyTour');
            var step = tour.getStep(tour.getCurrentStep()+1);
            if (typeof step == 'undefined') {
                startTour();
            } else {
                tourOverlay.switchtour = {btntext: 'restart'};
                tourOverlay.renderBtn();
                tourOverlay.removeOverlay();
                alert("Aborted");
            }
        },

        delay: 150,

        orphan: true,

        onNext: function(){
            if (tour.getCurrentStep() == -1){
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
            // tour.init(); does not work
            // tour.goTo(0); does not work
            // tour.start(true); does not work
            tour.restart();
        });
    };

    var startTour = function() {
        tourOverlay.switchtour = {btntext: 'end'};
        tourOverlay.renderBtn();
        tourOverlay.showOverlay();

        var url = gxy_root + 'api/webhooks/switchtour/get_data';
        $.ajax({
            url: url,
            dataType: 'json',
            async: false,
            success: function(data) {
                if (data.success) {
                    lasttool = data.lasttool;
                    workflow = data.workflow;
                    commands = data.commands;
                } else {
                    alert("This should not happen - Please report");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                }
            }
        });

        url = gxy_root + 'api/tours/';
        $.getJSON(url, function(data) {
            var values = [];
            var descriptions = [];
            var tmp = 1;
            for(var i in data) {
                switch(lasttour) {
                    case 1:
                        tmp = 2;
                        if (/^tour_2/.test(data[i].id)){
                            values.push(data[i].id);
                            descriptions.push(data[i].description)
                        }
                        break;
                    case 2:
                        tmp = 3;
                        if (/^tour_3/.test(data[i].id)){
                            values.push(data[i].id);
                            descriptions.push(data[i].description)
                        }
                        break;
                    case 3:
                        tmp = 4;
                        break;
                    default:
                        tmp = 1;
                        if (/^tour_1/.test(data[i].id)){
                            values.push(data[i].id);
                            descriptions.push(data[i].description)
                        }
                }
            }
            lasttour = tmp;
            if (lasttour == 4){
                tourOverlay.renderText("Ciao Cacao!","Please don't forget to");
                tourOverlay.renderForm([], []);
            } else {
                tourOverlay.renderText("Please select","")
                tourOverlay.renderForm(values, descriptions);
            }
        });
    }

    var gxy_root = typeof Galaxy === 'undefined' ? '/' : Galaxy.root;
    var tour;
    var workflow;
    var lasttool;
    var commands;
    var lasttour;
    var tourOverlay = new TourOverlayView();
});
