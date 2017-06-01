$(document).ready(function() {

    var galaxyRoot = typeof Galaxy != 'undefined' ? Galaxy.root : '/';

    //be aware of element names in style.css!
    var ComicView = Backbone.View.extend({
        el: '#comic',

        appTemplate: _.template(
            '<div id="comic-header">' +
                '<div id="comic-name">Comic</div>' +
                '<button id="comic-btn">Random</button>' +
            '</div>' +
            '<div id="comic-img"></div>'
        ),

        imgTemplate: _.template('<img src="<%= img %>" alt="<%= alt %>" title="<%= title %>">'),

        events: {
            'click #comic-btn': 'getRandomComic'
        },

        initialize: function() {
            var self = this;
            this.render();
            $.getJSON('http://dynamic.xkcd.com/api-0/jsonp/comic?callback=?', function(data) {
                self.latestId = data.num;
                self.getRandomComic();
            });
        },

        render: function() {
            this.$el.html(this.appTemplate());
            this.$comicImg = this.$('#comic-img');
            return this;
        },

        getRandomComic: function() {
            var self = this;
            var randomId = Math.floor(Math.random() * this.latestId) + 1;

            this.$comicImg.html($('<div/>', {id: 'comic-loader'}));

            $.getJSON('http://dynamic.xkcd.com/api-0/jsonp/comic/' + randomId + '?callback=?', function(data) {
                self.comic = {img: data.img, alt: data.alt, title: data.title};
                self.renderImg();
            });
        },

        renderImg: function() {
            this.$comicImg.html(this.imgTemplate({img: this.comic.img, alt: this.comic.alt, title: this.comic.title}));
        }

    });

    new ComicView();
});
