function run(){

$(document).ready( () => {

    var SwitchtourView = Backbone.View.extend({

        parent: $('.full-content'),

        el: '#switchtour',

        button: _.template(
            '<div id="switchtour-masthead">' +
                '<button id="switchtour-button"><%= text %></button>' +
            '</div>'
        ),

        loader: _.template(
            '<div id="switchtour-loader"></div>'
        ),

        helper: _.template(
            '<div id="iframe-helper"></div>'
        ),

        menu: _.template(
            '<div id="switchtour-menu">' +
                '<div id="switchtour-config" style="display:none">' +
                    '<h3>Admin configuration</h3>' +
                    '<div align="left">' +
                        '<button id="switchtour-config-update" class="float-right">Update tours DB</button>' +
                        '<input id="switchtour-config-keephist" type="checkbox"> Keep history' +
                        '<br>' +
                        '<input id="switchtour-config-mouse" type="checkbox"> Enable mouse events' +
                        '<br>' +
                        '<input id="switchtour-config-autorun" type="checkbox"> Auto run tour' +
                    '</div>' +
                    '<br>' +
                '</div>' +
                '<div id="switchtour-text"></div>' +
                '<br>' +
                '<div id="switchtour-checkbox" align="left"></div>' +
                '<br>' +
                '<button id="switchtour-submit">Submit</button>' +
                '<div id="switchtour-download">' +
                    '<br>' +
                    '<h4>Download current</h4>' +
                    '<button id="switchtour-workflow">Workflow</button>' +
                    '&nbsp' +
                    '<button id="switchtour-commands">Commands</button>' +
                    '&nbsp' +
                    '<button id="switchtour-bibtex">Citations</button>' +
                '</div>' +
            '</div>'
        ),

        checkbox: _.template(
            '<label class="switchtour-mouseover">' +
                '<iframe src="<%= url %>" class="switchtour-help" id="switchtour-help-<%= value %>" onmouseout=\'$("#switchtour-help-<%= value %>").css("display", "none");\'></iframe>' +
                '<input type="radio" name="switchtour-select" value="<%= value %>">' +
                '<text onmouseover=\'$(".switchtour-help").css("display", "none"); $("#switchtour-help-<%= value %>").css("display", "block");\'>' +
                    '<%= description %>' +
                '</text>' +
            '</label>' +
            '<br>'
        ),

        text: _.template(
            '<h3><%= header %></h3>' +
            '<b><%= text %></b>'
        ),

        initialize: function() {
            this.render();
            this.register();
        },

        render: function() {
            this.parent.prepend(this.menu({header: 'header', text: 'text'}));
            this.parent.prepend(this.loader());
            this.parent.prepend(this.helper());
            this.removeLoader();
            this.removeMenu();
            this.$el.html(this.button({text: 'Workflow generator'}));
        },

        // builtin alternative to register
        // events: {
        //     'click #switchtour-button': 'invoke'
        // },
        register: function() {
            this.$el.on('click', (e) => {
                e.stopPropagation();
                var element = document.getElementById('switchtour-button');
                var buttontext = element.textContent || element.innerText;
                if ( buttontext === 'Abort' || buttontext === 'End' ){
                    this.abort();
                } else {
                    this.invoke();
                }
            });

            this.parent.on('keydown', (e) => {
                e.stopPropagation();
                if ( e.which === 27 || e.keyCode === 27 ) {
                    var element = document.getElementById('switchtour-button');
                    var buttontext = element.textContent || element.innerText;
                    if ( buttontext === 'Abort' || buttontext === 'End' ){
                        this.abort();
                    } else {
                        this.invoke();
                    }
                }
            });

            $('#switchtour-submit').on('click', (e) => {
                e.stopPropagation();
                this.runSelection();
            });

            $('#switchtour-workflow').on('click', (e) => {
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_workflow'}, (ret) => {
                    if (ret.success) {
                        this.download('workflow.yaml',JSON.stringify(ret.data.workflow, null, 2));
                    } else {
                        alert('Something unexpected happened!\n\nWe will offer to download your history instead.');
                        window.open(Galaxy.root + 'history/export_archive','galaxy_main');
                    }
                });
            });

            $('#switchtour-commands').on('click', (e) => {
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_commands'}, (ret) => {
                    this.download('commands.sh',ret.data.commands);
                });
            });

            $('#switchtour-bibtex').on('click', (e) => {
                e.stopPropagation();
                $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_bibtex'}, (ret) => {
                    this.download('citations.bib',ret.data.bibtex);
                });
            });


            $('#switchtour-config-update').on('click', (e) => {
                e.stopPropagation();
                if(adminMode){
                    $.ajax({
                        url: Galaxy.root + 'api/webhooks/switchtour/data',
                        data: {
                            fun: 'update_tours'
                        },
                        async: false,
                        success: function(ret) {
                            $.ajax({
                                url: Galaxy.root + 'api/webhooks/switchtour/data',
                                data: {
                                    fun: 'update_tours'
                                },
                                async: false,
                                success: function(ret) {
                                    alert('Tours sucessfully updated');
                                },
                                error: function(e) {
                                    console.log(e);
                                }
                            });
                        },
                        error: function(e) {
                            console.log(e);
                        }
                    });
                }
            });
        },

        showMenu: function() {
            $('#columns').css('filter', 'blur(3px)');
            $('#masthead').css('pointer-events', 'none');
            $('#columns').css('pointer-events', 'none');
            $('#switchtour-masthead').css('pointer-events', 'auto');
            $('#switchtour-menu').show();
        },

        removeMenu: function() {
            $('#columns').css('filter', 'none');
            $('#columns').css('pointer-events', 'auto');
            $('#masthead').css('pointer-events', 'auto');
            $('#switchtour-menu').hide();
        },

        showLoader: function() {
            $('#columns').css('filter', 'blur(3px)');
            $('#masthead').css('pointer-events', 'none');
            $('#columns').css('pointer-events', 'none');
            $('#switchtour-masthead').css('pointer-events', 'auto');
            $('.modal-content').css('filter', 'blur(3px)');
            $('.modal-content').css('pointer-events', 'none');
            $('.modal').css('pointer-events', 'none');
            $('.popover').css('filter', 'blur(3px)');
            $('.popover').css('pointer-events', 'none');
            $('#switchtour-loader').show();
        },

        removeLoader: function() {
            $('#columns').css('filter', 'none');
            $('#masthead').css('pointer-events', 'auto');
            $('#columns').css('pointer-events', 'auto');
            $('.modal-content').css('filter', 'none');
            $('.modal-content').css('pointer-events', 'auto');
            $('.modal').css('pointer-events', 'auto');
            $('.popover').css('filter', 'none');
            $('.popover').css('pointer-events', 'auto');
            $('#switchtour-loader').hide();
        },

        abort: function() {
            this.$el.html(this.button({text: 'Restart'}));
            this.removeMenu();
            this.removeLoader();
            observeElements = [];
            tourcounter = 0;
            if (typeof tour !== 'undefined' && ! tourEnded) {
                tourEnded = true;
                tour.end();
            }
        },

        invoke: function() {
            $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: ''}, (ret) => {
                if (ret.success) {
                    historyid = ret.data.historyid;
                    if (tourcounter > 0) {
                        $.getJSON(Galaxy.root + 'api/tours', (tour) =>  {
                            var choices = '';
                            var regex = new RegExp(tourprefix + '_' + tourcounter);
                            var url = Galaxy.root + 'static/welcome.html';
                            for( var i in tour ) {
                                if( regex.test(tour[i].id) ) {
                                    $.ajax({
                                        url: Galaxy.root + 'static/test.html',
                                        async: false,
                                        success: function() {
                                            url = Galaxy.root + 'static/test.html';
                                            $.ajax({
                                                url: Galaxy.root + 'static/'+ tour[i].id + '.html',
                                                async: false,
                                                success: function() {
                                                    url = Galaxy.root + 'static/'+ tour[i].id + '.html'
                                                },
                                                error: function(e) {
                                                    console.log(e);
                                                }
                                            });
                                        },
                                        error: function(e) {
                                            console.log(e);
                                        }
                                    });
                                    choices = choices.concat(this.checkbox({value: tour[i].id, description: tour[i].description, url: url}));
                                }
                            }
                            if(choices){
                                $('#switchtour-text').html(this.text({header: 'Please select an atom', text: ''}));
                                $('#switchtour-submit').show();
                            } else {
                                switchtour.$el.html(switchtour.button({text: 'End'}));
                                $('#switchtour-submit').hide();
                                $('#switchtour-text').html(this.text({header: 'Success!', text: 'You completed this guide!<br>Please do not forget to...'}));
                            }
                            $('#switchtour-checkbox').html(choices);
                            if (tourcounter > 1) { 
                                $('#switchtour-download').show();
                            }
                            $("#switchtour-config").css('display','none');
                            this.showMenu();
                        });
                    } else {
                        this.$el.html(this.button({text: 'Abort'}));
                        $.getJSON(Galaxy.root + 'api/tours', (tours) => {
                            var choices = '';
                            var regex = new RegExp('destair_linker');
                            var url = Galaxy.root + 'static/welcome.html';
                            for( var i in tours ) {
                                if( regex.test(tours[i].id) ) {
                                    $.ajax({
                                        url: Galaxy.root + 'static/'+ tours[i].id + '.html',
                                        async: false,
                                        success: function() {
                                            url = Galaxy.root + 'static/'+ tours[i].id + '.html';
                                        },
                                        error: function() {
                                            $.ajax({
                                                url: Galaxy.root + 'static/test.html',
                                                async: false,
                                                success: function() {
                                                    url = Galaxy.root + 'static/test.html'
                                                },
                                                error: function(e) {
                                                    console.log(e);
                                                }
                                            });
                                        }
                                    });
                                    choices = choices.concat(this.checkbox({value: tours[i].tags[0], description: tours[i].description, url: url}));
                                }
                            }
                            $('#switchtour-text').html(this.text({header: 'Welcome to de.STAIR workflow generator', text: 'Which type of analysis do you want to perform?'}));
                            $('#switchtour-checkbox').html(choices);
                            $('#switchtour-submit').show();
                            $('#switchtour-download').hide();
                            this.showMenu();
                        });

                        $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'get_user'}, (ret) => {
                            if (ret.success && ret.data.isadmin) {
                                adminMode = true;
                                $("#switchtour-config").css('display','inline');
                                $("#switchtour-config-keephist").prop('checked','true');
                                $("#switchtour-config-mouse").prop('checked','true');
                            } else {
                                adminMode = false;
                            }
                        });
                    }
                } else {
                    alert("Something unexpected happened!");
                    console.error('[ERROR] "' + url + '":\n' + data.error);
                }
            });
        },

        download: (filename, data) => {
            var blob = new Blob([data], {type: 'application/octet-stream'});
            var e = document.createElement('a');
            document.body.appendChild(e);
            e.href = window.URL.createObjectURL(blob);
            e.download = filename; // works without document.body.appendChild(e); but then no dl dialog firefox
            e.click();
            document.body.removeChild(a);
        },

        runSelection: function() {
            var tourid = $("input[name='switchtour-select']").filter(':checked').val();
            if (tourid && tourcounter === 0) {
                if (!adminMode || (adminMode && $("#switchtour-config-keephist")[0].checked === false)){
                    $.getJSON(Galaxy.root + 'api/webhooks/switchtour/data', {fun: 'new_history'}, (ret) => {
                        historyid = ret.data.historyid;

                        // Galaxy.currHistoryPanel.refreshContents(); does not work
                        $('#history-refresh-button').click();
                    });
                }
                if (adminMode && $("#switchtour-config-mouse")[0].checked === true){
                    mouseMode = true;
                } else {
                    mouseMode = false;
                }
                if (adminMode && $("#switchtour-config-autorun")[0].checked === true){
                    autorun = true;
                } else {
                    autorun = false;
                }
                tourprefix = tourid;
                tourcounter++;
                $("input[name='switchtour-select']").prop('checked', false);
                this.invoke();
            } else if (tourid) {
                tourcounter++;
                this.removeMenu();

                $.getJSON( Galaxy.root + 'api/tours/' + tourid, (data) => {
                    //sanity check and alias definition
                    let stepIdx = 0;
                    for (const step of data.steps) {
                        if (step.postclick) {
                            step.onnextclick = step.postclick;
                            step.postclick = undefined;
                        }
                        if (step.preclick) {
                            step.onloadclick = step.preclick;
                            step.preclick = undefined;
                        }
                        if (step.autoclick) {
                            step.onloadclick = step.autoclick;
                            step.preclick = undefined;
                        }
                        var allowedKeys = new Set(["title", "element", "placement", "content", "onnextclick", "onprevclick",
                                                   "textinsert", "select" , "unselect", "onloadwait", "onloadclick", "duration", "delay",
                                                   "orphan", "backdrop", "pointer", "postclick", "preclick", "autoclick", "iframeelement", "exit", "rename"]);
                        Object.keys(step).forEach(function(key,index) {
                             if(! allowedKeys.has(key)){
                                 alert("Error in tour " + tourid + ": step " + (stepIdx + 1) + " invalid key " + key);
                             }
                        });
                        ++stepIdx;
                    } 
                    
                    sessionStorage.setItem('activeGalaxyTour', JSON.stringify(data));
                    tour = new Tour(_.extend({
                        steps: data.steps,
                    }, tour_opts));
                    tour.restart();
                });                
            }
        },
    });

    var switchtour = new SwitchtourView();
    var tour;
    var adminMode = false;
    var mouseMode = false;
    var autorun = false;

    var Galaxy = window.bundleEntries.getGalaxyInstance();
//  for(var k in Galaxy) {
//      v = Galaxy[k];
//      console.log(k,v);
//  }
//  Galaxy.currHistoryPanel.refreshContents(); switchToHistory() createNewHistory()   

    var tourcounter = 0;
    var tourprefix = '';
    var tourEnded = false;
    var timeoutcounter = 1;

    var historyid = '';

    var tour_opts = {
        storage: window.sessionStorage,

        keyboard: false,
        
        onStart: function(){
            tourEnded = false;
        },

        onNext: function() {
            var step = tour.getStep(tour.getCurrentStep());
            if(step.onnextclick) {
                if(step.iframeelement){
                    _.each(step.onnextclick, (e) => {
                        console.log('tofind' ,e);
                        const el = $("#galaxy_main").contents().find(e);
                        el.mousedown().mouseup();
                        if($("#galaxy_main").contents().find(e).length > 0){
                            el[0].click();
                        }
                    });
                } else {
                    _.each(step.onnextclick, (e) => {
                        const el = $(e);
                        el.mousedown().mouseup();
                        if($(e).length > 0){
                            el[0].click();
                        }
                    });
                }
            }
            step = tour.getStep(tour.getCurrentStep()+1);
            if (typeof step === 'undefined') {
                tour.end();
                switchtour.invoke();
            }
        },

        onPrev: function() {
            var step = tour.getStep(tour.getCurrentStep());
            if(step.onprevclick) {
                if(step.iframeelement){
                    _.each(step.onprevclick, (e) => {
                        const el = $("#galaxy_main").contents().find(e);
                        el.mousedown().mouseup();
                        if($("#galaxy_main").contents().find(e).length > 0){
                            el[0].click();
                        }
                    });
                } else {
                    _.each(step.onnextclick, (e) => {
                        const el = $(e);
                        el.mousedown().mouseup();
                        if($(e).length > 0){
                            el[0].click();
                        }
                    });
                }
            }
        },

        onShown: function() {
            if(! mouseMode ){
                $('#masthead').css('pointer-events', 'none');
                $('#columns').css('pointer-events', 'none');
                $('.modal-content').css('pointer-events', 'none');
                $('.modal').css('pointer-events', 'none');
                $('#switchtour-masthead').css('pointer-events', 'auto');
            }
            var step = tour.getStep(tour.getCurrentStep());
            if (step.element){
                $(step.element)[0].scrollIntoView(false);
            }
            if (step.element && step.rename){
                 _.each(step.rename, (e) => {
                    const collectionid = $(e.element)[0].id.split("-")[1];
                    $.ajax({
                        url: Galaxy.root + 'api/histories/' + historyid + '/contents/dataset_collections/' + collectionid,
                        async: false,
                        type: 'PUT',
                        datatype: "json",
                        data: { name : e.name },
                        success: function(ret) {
                        },
                        error: function(e) {
                            console.log(e);
                        }
                    });
                });
            }
            if (step.onloadclick || step.textinsert || step.select || step.unselect){

                needDelay = false;

                if(step.iframeelement){
                    if(step.textinsert){
                        needDelay = true;
                         // vue.js does not recognize jquery triggers, thus needs vanilla js
                        let e = $("#galaxy_main").contents().find(step.iframeelement)[0];
                        e.value = step.textinsert;
                        e.dispatchEvent(new Event("change",{bubbles:true}));
                        e.dispatchEvent(new Event("input",{bubbles:true}));
                    }
                    _.each(step.select, (e) => {
                        $("#galaxy_main").contents().find(e)[0].prop("selected", true);
                        $("#galaxy_main").contents().find(e)[0].prop("checked", true);
                        let ep = $("#galaxy_main").contents().find(e).parent()[0];
                        if(ep.nodeName === "SELECT"){
                            needDelay = true;
                            ep.dispatchEvent(new Event("change",{bubbles:true}));
                            ep.dispatchEvent(new Event("input",{bubbles:true}));
                        }
                    });
                    _.each(step.unselect, (e) => {
                        $("#galaxy_main").contents().find(e).prop("selected", false);
                        $("#galaxy_main").contents().find(e).prop("checked", false);
                        let ep = $("#galaxy_main").contents().find(e).parent()[0];
                        if(ep.nodeName === "SELECT"){
                            needDelay = true;
                            ep.dispatchEvent(new Event("change",{bubbles:true}));
                            ep.dispatchEvent(new Event("input",{bubbles:true}));
                        }
                    });

                    if(step.onloadclick){
                        if(needDelay){
                            switchtour.showLoader();
                            setTimeout(function(){
                                _.each(step.onloadclick, (e) => {
                                    const el = $("#galaxy_main").contents().find(e);
                                    el.mousedown().mouseup();
                                    if($("#galaxy_main").contents().find(e).length > 0){
                                        el[0].click();
                                    }
                                });
                                switchtour.removeLoader();
                            },500);
                        } else {
                            _.each(step.onloadclick, (e) => {
                                const el = $("#galaxy_main").contents().find(e);
                                el.mousedown().mouseup();
                                if($("#galaxy_main").contents().find(e).length > 0){
                                    el[0].click();
                                }
                            });
                        }
                    }
                } else {
                    if(step.textinsert){
                        needDelay = true;
                        // vue.js does not recognize jquery triggers, thus needs vanilla js
                        $(step.element)[0].value = step.textinsert;
                        $(step.element)[0].dispatchEvent(new Event("change",{bubbles:true}));
                        $(step.element)[0].dispatchEvent(new Event("input",{bubbles:true}));
                    }
                    _.each(step.select, (e) => {
                        $(e).prop("selected", true);
                        $(e).prop("checked", true);
                        let ep = $(e).parent()[0];
                        if(ep.nodeName === "SELECT"){
                            needDelay = true;
                            ep.dispatchEvent(new Event("change",{bubbles:true}));
                            ep.dispatchEvent(new Event("input",{bubbles:true}));
                        }
                    });
                    _.each(step.unselect, (e) => {
                        $(e).prop("selected", false);
                        $(e).prop("checked", false);
                        let ep = $(e).parent()[0];
                        if(ep.nodeName === "SELECT"){
                            needDelay = true;
                            ep.dispatchEvent(new Event("change",{bubbles:true}));
                            ep.dispatchEvent(new Event("input",{bubbles:true}));
                        }
                    });

                    if(step.onloadclick){
                        if(needDelay){
                            switchtour.showLoader();
                            setTimeout(function(){
                                _.each(step.onloadclick, (e) => {
                                    const el = $(e);
                                    el.mousedown().mouseup();
                                    if($(e).length > 0){    
                                        el[0].click();
                                    }
                                });
                                switchtour.removeLoader();
                            },500);
                        } else {
                            _.each(step.onloadclick, (e) => {
                                const el = $(e);
                                el.mousedown().mouseup();
                                if($(e).length > 0){    
                                    el[0].click();
                                }
                            });
                        }
                    }
                }
            }
            if(step.element && step.pointer){
                $(step.element).css('pointer-events', 'auto');
            }
            if (step.exit) {
                switchtour.abort();
            } else {
                if(autorun){
                    setTimeout(function(){
                        tour.next();
                    },1000);
                }
            }
        },

        onEnd: function() {
            switchtour.removeLoader(); //just to re-enable pointer event
            tourEnded = true;
            sessionStorage.removeItem('activeGalaxyTour');
            var step = tour.getStep(tour.getCurrentStep()+1);
            if (typeof step === 'undefined') {
                switchtour.invoke();
            } else {
                tourcounter = 0;
                switchtour.$el.html(switchtour.button({text: 'Restart'}));
            }
        },

        delay: 0,

        orphan: true,

        //added id - from 19.05 on, template will be overridden to avoid <script> execution and to block non-text html tags
        // template: `<div id="tour-bubble" class="popover" role="tooltip">
        //                <div class="arrow"></div> 
        //                <h3 class="popover-header"></h3> 
        //                <div class="popover-body"></div> 
        //                    <div class="popover-navigation"><div class="btn-group">
        //                     <button class="btn btn-sm btn-secondary" data-role="prev">&laquo; Prev</button>
        //                        <button class="btn btn-sm btn-secondary" data-role="next">Next &raquo;</button>
        //                    </div>
        //                    <button class="btn btn-sm btn-secondary" data-role="end">End tour</button>
        //                </div>
        //            </div>`,

         onShow: function(tour,i) {
            if(i === null){
                i = 0;
            }
            let step = tour.getStep(i);
            if (typeof step !== 'undefined') {
                if(step.iframeelement){
                    let rect1 = $('.center-container')[0].getBoundingClientRect();
                    let rect2 = $("#galaxy_main").contents().find(step.iframeelement)[0].getBoundingClientRect();
                    let e = document.getElementById('iframe-helper');
                    e.style.top = rect2.top + rect1.top + 'px';
                    e.style.left = rect2.left + rect1.left + 'px';
                    e.style.width = rect2.width + 'px';
                    e.style.height = rect2.height + 'px';
                } else {
                    if(step.onloadwait){
                        _.each(step.onloadwait, (e) => {
                            if(! e.hasOwnProperty('count')){
                                e.count = 1;
                            }
                            if(! e.hasOwnProperty('mincount')){
                                e.mincount = Infinity;
                            }
                            observeElements.push({element: e.element, count: e.count, mincount: e.mincount});
                        });
                    }
                    if(step.element){
                        observeElements.push({element: step.element, count: 1, mincount: Infinity});
                    }
                    if(step.onloadclick){
                        _.each(step.onloadclick, (e) => {
                            observeElements.push({element: e, count: 1, mincount: Infinity});
                        });
                    }
                    if(step.onnextclick){
                        _.each(step.onnextclick, (e) => {
                            observeElements.push({element: e, count: 1, mincount: Infinity});
                        });
                    }
                    if(step.onprevclick){
                        _.each(step.onprevclick, (e) => {
                            observeElements.push({element: e, count: 1, mincount: Infinity});
                        });
                    }

                    if (observeElements.length > 0){
                        console.log('wait for: ', observeElements);
                        const promise = new Promise( (resolve,reject) => {
                            promiseResolve = resolve;
                            promiseReject = reject;
                        });
                        switchtour.showLoader();
                        timeoutLoader();
                        observer.observe(document, {subtree:true, childList:true} );
                        $('<div>').attr('type','hidden').appendTo('body').remove(); //trigger observer
                        setTimeout(function(){
                            $('<div>').attr('type','hidden').appendTo('body').remove(); //trigger observer again after delay, in case we are too slow
                        }, 500);
                        return promise;
                    }
                }
            }
        }
    };

    var currentTimeout;
    function timeoutLoader(){
        if(! tourEnded){
            currentTimeout = setTimeout(function(){
                let message = 'At least one HTML element is not available yet\n\nIf some history jobs are still pending (grey or yellow),\nplease wait a little longer [OK]\nOr return to the previous step by [CANCEL]';
                if (adminMode){
                    message = message + '\n\n' + JSON.stringify(observeElements);
                }
                if(autorun){
                    console.log("waiting for" , observeElements);
                    $('<div>').attr('type','hidden').appendTo('body').remove(); //trigger observer
                    timeoutLoader();
                } else {
                    if (confirm(message)) {
                        $('<div>').attr('type','hidden').appendTo('body').remove(); //trigger observer
                        timeoutcounter++;
                        timeoutLoader();
                    } else {
                        promiseReject();
                        switchtour.removeLoader();
                        observeElements = [];
                        tour.prev();
                    }
                }
            }, 10000*timeoutcounter);
        }
    }

    var observeElements = [];
    var promiseResolve = null;
    var promiseReject = null;
    var observer = new MutationObserver((mutations, observer) => {
        let ispresent = 0;
        for(let i=observeElements.length-1; i >= 0 ; i--){
            let found = $(observeElements[i].element).length;
            observeElements[i].found = found;
            if(found === observeElements[i].count || $(observeElements[i].element).length >= observeElements[i].mincount){
                console.log($(observeElements[i].element).length,' times found ',observeElements[i].element);
                ispresent++;
                //observeElements.splice(i,1);
            }
        }
        if(ispresent === observeElements.length){
            observeElements = [];
            observer.disconnect();
            clearTimeout(currentTimeout);
            switchtour.removeLoader();
            promiseResolve();
        }
    });
});

}
