$(document).ready(function() {

    var TourOverlayView = Backbone.View.extend({

        el: '#switchtour',

        parentElement: $('.full-content'),

        appTemplate: _.template(
            '<div id="switchtour-overlay-div">' +
                '<div id="switchtour-qa-div">' +
                    '<br>' +
                    '<div id="switchtour-text-div"></div>' +
                    '<div id="switchtour-form-div"></div>' +
                    '<button id="switchtour-submit-btn">Submit</button>' +
                    '<br><br>' +
                    '<b>Download current</b>' +
                    '<br>' +
                    '<button id="download-wf-btn">Workflow</button>' +
                    '&nbsp' +
                    '<button id="download-cmd-btn">Commands</button>' +
					'&nbsp' +
                    '<button id="download-bib-btn">Citations</button>' +
                    '<br><br>' +
                    '<button id="switchtour-restart-btn">Restart workflow generator</button>' +
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
                    // setRnaSeqParameter();
                    self.render();
                    self.registerEvents();
					createHistory();
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
            this.$restartBtn = $('#switchtour-restart-btn');
            this.$downloadWFbtn = $('#download-wf-btn');
            this.$downloadCMDbtn = $('#download-cmd-btn');
			this.$downloadBIBbtn = $('#download-bib-btn');
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
            self.$selectIn = $("input[name='switchtour-select-in']");
            //alert(lasttool + o)
            if (lasttour > 0 && ! o) {
                self.$submitBtn.hide();
                self.$restartBtn.show();
            } else {
                self.$submitBtn.show();
                self.$restartBtn.hide();
            }
        },

        renderText: function (text1,text2) {
            this.$textDiv.html(this.textTemplate({text1: text1, text2: text2}));
        },

        invokeOverlay: function() {
            var self = this;
            if (this.switchtour.btntext == 'Quit & purge'){
                if (typeof tour !== 'undefined' && ! tour.ended()) {
                    tour.end();
                } else {
                    self.switchtour = {btntext: 'Restart'};
                    self.removeOverlay();
                    self.renderBtn();
					purgeHistory();
                }
            } else {
                self.switchtour = {btntext: 'Quit & purge'};
                self.showOverlay();
                self.renderBtn();
				lasttour = null;
				createHistory();
				startTour();
            }
        },

        runSelection: function (){
            var value = this.$selectIn.filter(':checked').val();
            if(value){
                this.$selectIn.prop('checked', false);
                this.removeOverlay();
				if(lasttour == 0){
					tourprefix = value;
					startTour();
				} else {
	                giveTour(value);
				}
            }
        },

        downloadString: function(data) {
			if (lasttour > 0) {
            	blob = new Blob([data], {type: "application/octet-stream"});
				var e = document.createElement("a");
				document.body.appendChild(e);
				e.href = window.URL.createObjectURL(blob);
				e.click();
				document.body.removeChild(a);
			}
        },

        downloadJson: function(data) {
			if (lasttour > 0) {
	            blob = new Blob([JSON.stringify(data)], {type: "application/octet-stream"});
    	        var e = document.createElement("a");
        	    document.body.appendChild(e);
	            e.href = window.URL.createObjectURL(blob);
    	        e.click();
        	    document.body.removeChild(a);
			}
        },

        registerEvents: function() {
            var self = this;
            this.parentElement.on('keydown',function(e) {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    self.switchtour = {btntext: 'Restart'};
                    self.renderBtn();
                    self.removeOverlay();
					purgeHistory();
                }
            });

            this.$submitBtn.on('click',function(e){
                e.stopPropagation();
                self.runSelection();
            });

            this.$restartBtn.on('click',function(e){
                e.stopPropagation();
                lasttour = null;
                startTour();
            });

            this.$downloadWFbtn.on('click',function(e){
                e.stopPropagation();
                self.downloadString(workflow);
            });

            this.$downloadCMDbtn.on('click',function(e){
                e.stopPropagation();
                alert(commands);
                self.downloadString(commands);
            });

			this.$downloadBIBbtn.on('click',function(e){
                e.stopPropagation();
                self.downloadString(bibtex);
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
                //tourOverlay.switchtour = {btntext: 'Restart'};
                //tourOverlay.renderBtn();
                tourOverlay.removeOverlay();
                alert("Aborted");
                lasttour=null
                startTour();
				//purgeHistory();
            }
        },

        delay: 150,

        orphan: true,

        onNext: function(){
			var tourstep = tour.getCurrentStep();
            if (tourstep == -1){
                tour.end();
                startTour();
            }
			// else {
				// var url = gxy_root + 'api/webhooks/switchtour/get_data';
				// var finished = 0;
				// while (finished == 0){
					// $.ajax({
					// 	url: url,
					// 	dataType: 'json',
					// 	async: false,
					// 	success: function(data) {
					// 		if (data.success) {
					// 			finished = data.finished;
					// 		} else {
					// 			alert("This should not happen - Please report");
					// 			console.error('[ERROR] "' + url + '":\n' + data.error);
					// 		}
					// 	}
					// });
				//}
			// }
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
		tourOverlay.switchtour = {btntext: 'Quit & purge'};
        tourOverlay.renderBtn();
        tourOverlay.showOverlay();
		tourOverlay.renderText("Loading..","");
		tourOverlay.renderForm([], []);

		if (lasttour == null) {
			tourOverlay.renderText("Welcome to de.STAIR workflow generator","Which type of analysis do you want to perform?");
			tourOverlay.renderForm(["dgea","visualization"], ["Differential gene expression analysis","Visualization"]);
			lasttour = 0;
		} else {
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
						bibtex = data.bibtex;
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
				var tmp;
				var regex;
				lasttour += 1;
				regex = new RegExp(tourprefix + "_tour_" + lasttour);
				for(var i in data) {
					if (regex.test(data[i].id)){
						values.push(data[i].id);
						descriptions.push(data[i].description);
					}
				}
				if (values.length == 0){
					tourOverlay.renderText("Ciao Cacao!","You successfully completed this tour!<br>Please don't forget to ...");
					tourOverlay.renderForm([], []);
				} else {
					tourOverlay.renderText("Please select","")				
					tourOverlay.renderForm(values, descriptions);
				}
			});
		}
    }

	var purgeHistory = function() {
		alert("Cleaning recent history..");
		var url = gxy_root + 'api/webhooks/purgehistory/get_data';
		$.ajax({
			url: url,
			dataType: 'json',
			async: false,
			success: function(data) {
				if (data.success) {
					alert("History nuked!")
				} else {
					alert("This should not happen - Please report");
					console.error('[ERROR] "' + url + '":\n' + data.error);
				}
			}
		});
		$('#history-refresh-button').click();
	}

	var createHistory = function() {
		var url = gxy_root + 'api/webhooks/createhistory/get_data';
		$.ajax({
			url: url,
			dataType: 'json',
			async: false,
			success: function(data) {
				if (! data.success) {
					alert("This should not happen - Please report");
					console.error('[ERROR] "' + url + '":\n' + data.error);
				}
			}
		});
		$('#history-refresh-button').click();
	}

    var setRnaSeqParameter = function() {
        var url = gxy_root + 'api/webhooks/setrnaseqparameter/get_data';
		$.ajax({
			url: url,
			dataType: 'json',
			async: false,
			success: function(data) {
				if (! data.success) {
					alert("This should not happen - Please report");
					console.error('[ERROR] "' + url + '":\n' + data.error);
				}
			}
		});
    }

    var gxy_root = typeof Galaxy === 'undefined' ? '/' : Galaxy.root;
    var tour;
    var workflow;
    var lasttool;
    var commands;
    var lasttour;
	var bibtex;
	var tourprefix;
    var tourOverlay = new TourOverlayView();
});
