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
                '<b> <%= header %> </b>' +
                '<br>' +
                '<%= text %>' +
                '<br><br>' +
                '<div id="switchtour-checkbox"></div>' +
                '<button id="switchtour-submit">Submit</button>' +
                '<br><br>' +
                '<b>Download current</b>' +
                '<br>' +
                '<button id="switchtour-workflow">Workflow</button>' +
                '&nbsp' +
                '<button id="switchtour-cmds">Commands</button>' +
                '&nbsp' +
                '<button id="switchtour-bibtex">Citations</button>' +
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
            this.parent.prepend(this.menu({header: 'Welcome to de.STAIR guide', text: 'Which type of analysis do you want to perform?'}));
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

            $('#switchtour-submit').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                alert('clicked');
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
                        if (data.lasttool) {
                            $('#switchtour-menu').html(self.menu({header: 'header', text: 'text'}));
                            var choices = '';
                            choices = choices.concat(self.checkbox({value: 'value', description: 'description'}));
                            $('#switchtour-checkbox').html(choices);
                        }
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
