$(document).ready(function() {    

    var OverlayView = Backbone.View.extend({

        el: '#overlay',

        parentElement: $('.full-content'),

        appTemplate: _.template(
            '<div id="overlay-div">Please select:' +
                '<div id="form-div"></div>' +
                '<button id="submit-btn">Submit</button>' +
            '</div>' 
        ),

        formTemplate: _.template(
            '<input type="radio" name="select-in" value="<%= formvalue %>"><%= formvalue %><br>'
        ),

        mastheadTemplate: _.template(
            '<div id="masthead-div"></div>'
        ),

        btnTemplate: _.template(
            '<button id="masthead-btn"><%= btntext %></button>'
        ),

        events: {
            'click #masthead-btn': 'invokeOverlay'
        },

        initialize: function () {
            var self = this;
            this.render();

            this.registerEvents();

            self.overlay = {btntext: 'open'};
            self.renderBtn();
        },

        /** Render the overlay html */
        render: function() {
            this.parentElement.prepend(this.appTemplate());
            this.$el.html(this.mastheadTemplate());

            this.$mastheadDiv = this.$('#masthead-div');
            this.$formDiv = $('#form-div');
            this.$submitBtn = $('#submit-btn');
        },

        renderBtn: function() {
            this.$mastheadDiv.html(this.btnTemplate({btntext: this.overlay.btntext}));
        },

        renderForm: function (values) {
            var self = this;
            var o = '';
            $.each(values, function() {
                o = o.concat(self.formTemplate({formvalue: this}));
            });
            self.$formDiv.html(o);
            self.$selectIn = $("input[name='select-in']");
        },

        invokeOverlay: function() {
            var self = this;
            if (this.overlay.btntext == 'close'){
                self.overlay = {btntext: 'open'};    
                self.removeOverlay();
            } else {
                self.overlay = {btntext: 'close'};
                self.showOverlay();
            }
            self.renderBtn();
        },

        getSelection: function (){
            var value = this.$selectIn.filter(':checked').val();
            if(value){
                this.overlay = {selection: value};
                this.$selectIn.prop('checked', false);
                this.overlay = {btntext: 'close'};
                this.invokeOverlay();
                alert('selection was: ' + value);
            }
        },

        registerEvents: function() {
            var self = this;
            this.parentElement.on('keydown',function(e) {
                if( e ) {
                    e.stopPropagation();
                    if ( e.which === 27 || e.keyCode === 27 ) {
                        self.overlay = {btntext: 'close'};
                        self.invokeOverlay();
                    }
                }
            });
            this.$submitBtn.on('click',function(){
                self.getSelection();
            });
        },

        showOverlay: function() {
            $('#overlay-div').show();
            $('#left').css('filter', 'blur(5px)');
            $('#center').css('filter', 'blur(5px)');
            $('#right').css('filter', 'blur(5px)');
        },

        /** Remove the search overlay */
        removeOverlay: function() {
            $('#overlay-div').hide();
            $('#left').css('filter', 'none');
            $('#center').css('filter', 'none');
            $('#right').css('filter', 'none');
        },

    });

    var overlay = new OverlayView();
    overlay.renderForm(['a','b','c']);
    overlay.invokeOverlay();
});
