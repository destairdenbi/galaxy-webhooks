$(document).ready(function() {

    var galaxyRoot = typeof Galaxy != 'undefined' ? Galaxy.root : '/';
    
    //be aware of element names in style.css!
    //el namespace must match webhook directory name == yaml file name
    var helloView = Backbone.View.extend({
        el: '#hello',

        appTemplate: _.template(
            '<div id="hello-header">' +
                '<div id="hello-name">' +
                    'hello' +
                    '<div id="hello-text"></div>' +
                '</div>' +
                '<button id="hello-btn">replace</button>' +
            '</div>'
        ),

        textTemplate: _.template('<%= text %>'),

        events: {
            'click #hello-btn': 'replace'
        },

        initialize: function() {
            var self = this;
            this.render();
            self.hello = {text: 'world'};
            self.renderText();
        },

        render: function() {
            this.$el.html(this.appTemplate());
            this.$helloText = this.$('#hello-text');
            return this;
        },

        replace: function() {
            var self = this;
            if (this.hello.text == 'mars') {
                self.hello = {text: 'world'};
            } else {
                self.hello = {text: 'mars'};    
            }
            
            self.renderText();
        },

        renderText: function() {
            this.$helloText.html(this.textTemplate({text: this.hello.text}));
        }

    });

    new helloView();
});
