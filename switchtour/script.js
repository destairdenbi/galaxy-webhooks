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
                '<div id="switchtour-text"></div>' +
                '<br>' +
                '<div id="switchtour-checkbox" align="left"></div>' +
                '<br>' +
                '<button id="switchtour-submit">Submit</button>' +
                '<div id="switchtour-download">' +
                    '<br><br>' +
                    '<b>Download current</b>' +
                    '<br>' +
                    '<button id="switchtour-workflow">Workflow</button>' +
                    '&nbsp' +
                    '<button id="switchtour-commands">Commands</button>' +
                    '&nbsp' +
                    '<button id="switchtour-bibtex">Citations</button>' +
                '</div>' +
            '</div>'
        ),

        checkbox: _.template(
            '<input type="radio" name="switchtour-select" value="<%= value %>"><%= description %><br>'
        ),

        text: _.template(
            '<b> <%= header %> </b> <br> <%= text %>'
        ),

        initialize: function () {
            this.render();
            this.register();
        },

        render: function() {
            this.parent.prepend(this.menu({header: 'header', text: 'text'}));
            this.removeMenu();
            this.$el.html(this.button({text: 'de.STAIR guide'}));
        },

        // builtin alternative to registerEvents
        // events: {
        //     'click #switchtour-button': 'invokeMenu'
        // },
        register: function() {
            var self = this;

            // this.parent.find('ul #switchtour a').on('click', function(e) {
            this.$el.on('click', function(e) {
                e.stopPropagation();
                self.invokeMenu();
            });

            this.parent.on('keydown', function(e) {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    self.invokeMenu();
                }
            });

            $('#switchtour-submit').on('click', function(e) {
                e.stopPropagation();
                self.runSelection();
            });

            $('#switchtour-workflow').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_workflow'}, function(ret) {
                    self.download('workflow.yaml',ret.data.workflow);
                });
            });

            $('#switchtour-commands').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_commands'}, function(ret) {
                    self.download('commands.sh',ret.data.commands);
                });
            });

            $('#switchtour-bibtex').on('click',function(e){
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_bibtex'}, function(ret) {
                    self.download('citations.bib',ret.data.bibtex);
                });
                self.download('citations.bib',bibtex);
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

        invokeMenu: function() {
            var self = this;

            $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: ''}, function(ret) {
                if (ret.success) {
                    if ($('#switchtour-menu').is(':visible') ){
                        self.$el.html(self.button({text: 'Restart'}));
                        self.removeMenu();
                        tourid = 0;
                    } else {
                        self.$el.html(self.button({text: 'Abort'}));
                        if (tourid > 0) {
                            $('#switchtour-text').html(self.text({header: 'tools', text: 'to work with'}));
                            var choices = '';
                            // for (var i = 0; i < values.length; i++) {
                            choices = choices.concat(self.checkbox({value: 'value1', description: 'description1'}));
                            choices = choices.concat(self.checkbox({value: 'value2', description: 'description2'}));
                            $('#switchtour-checkbox').html(choices);
                            $('#switchtour-download').show();
                            tourid++;
                        } else {
                            tourid = 1;
                            var choices = '';
                            $.ajax({
                                url: Galaxy.root + 'api/tours',
                                dataType: 'json',
                                async: false,
                                success: function(tour) {
                                    var regex = new RegExp('destair_linker');
                                    for( var i in tour ) {
                                        if( regex.test(tour[i].id) ) {
                                            choices = choices.concat(self.checkbox({value: tour[i].tags[0], description: tour[i].description}));
                                        }
                                    }
                                }
                            });
                            $('#switchtour-text').html(self.text({header: 'Welcome to de.STAIR guide', text: 'Which type of analysis do you want to perform?'}));
                            $('#switchtour-checkbox').html(choices);
                            // $('#switchtour-download').hide(); TODO reactivate
                        }
                        self.showMenu();
                    }
                } else {
                    alert("Please login first");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                }
            });
        },

        download: function(filename, data) {
            // alert('download');
            var blob = new Blob([data], {type: 'application/octet-stream'});
            var e = document.createElement('a');
            document.body.appendChild(e);
            e.href = window.URL.createObjectURL(blob);
            e.download = filename; // works without document.body.appendChild(e); but then no dl dialog firefox
            e.click();
            document.body.removeChild(a);
        },

        runSelection: function (){
            var value = $("input[name='switchtour-select']").filter(':checked').val();
            if (value) {
                $("input[name='switchtour-select']").prop('checked', false);
                alert('runtour ' + value);
            }
        },

    });

    var switchtour = new SwitchtourView();
    var Galaxy = window.bundleEntries.getGalaxyInstance();
    // console.log(Galaxy.user);
    // console.log(Galaxy.currHistoryPanel); // client/galaxy/scripts/mvc/history/history-view.js
    // Galaxy.currHistoryPanel.refreshContents(); 

    var tourid = 0;
});
