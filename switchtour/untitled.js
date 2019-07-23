$(document).ready(function() {

    var SwitchtourView = Backbone.View.extend({

        parent: $('.full-content'),

        el: '#switchtour',

        button: _.template(
            '<div id="switchtour-masthead">' +
                '<button id="switchtour-button"><%= text %></button>' +
            '</div>'
        ),

        menu: _.template(
            '<div id="switchtour-menu">' +
                '<div id="switchtour-checkbox">Test</div>' +
            '</div>'
        ),

        checkbox: _.template(
            '<input type="radio" name="switchtour-select" value="<%= value %>"><%= description %><br>'
        ),

        initialize: function () {
            this.render();
            this.registerEvents();
        },

        render: function() {
            this.parent.prepend(this.menu());
            this.removeMenu();
            this.$el.html(this.button({text: 'de.STAIR guide'}));
        },

        // builtin alternative to registerEvents
        // events: {
        //     'click #switchtour-button': 'invokeMenu'
        // },
        registerEvents: function() {
            var self = this;

            // solution without button template:
            // this.parent.find('ul #switchtour a').on('click', function(e) {
            this.$el.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.invokeMenu();
            });

            this.parent.on('keydown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    self.invokeMenu();
                }
            });
        },

        invokeMenu: function() {
            var self = this;

            $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', function(data) {
                if (data.success) {
                    if ($('#switchtour-menu').is(':visible') ){
                        self.$el.html(self.button({text: 'Restart'}));
                        self.removeMenu();
                    } else {
                        self.$el.html(self.button({text: 'Abort'}));
                        self.showMenu();
                    }
                } else {
                    alert("Please login first");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                }
            });
        },

        showMenu: function() {
            $('#columns').css('filter', 'blur(5px)');
            $('#columns').css('pointer-events', 'none');
            $('#switchtour-menu').show();
        },

        removeMenu: function() {
            $('#columns').css('filter', 'none');
            $('#columns').css('pointer-events', 'auto');
            $('#switchtour-menu').hide();
        },

    });

    var switchtour = new SwitchtourView();
});
