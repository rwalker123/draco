var WelcomeClass = function (accountId, isAdmin, teamId) {
    this.init(accountId, isAdmin, teamId);
};

$.extend(WelcomeClass.prototype, {
    // object variables
    welcomeId: 0,
    accountId: 0,
    teamId: 0,
    menuLinkSelector: 'a[id^="MenuLink_"]',

    init: function (accountId, isAdmin, teamId) {
        this.welcomeId = 0;
        this.accountId = accountId;
        this.isAdmin = isAdmin;
        this.teamId = teamId;

        $('#welcomeMessageControl').tinymce(
            {
                height: 400,
                toolbar1: 'undo redo | cut copy paste | styleselect |  bullist numlist | outdent indent  | table | link',
                toolbar2: 'fontselect | fontsizeselect | forecolor backcolor | spellchecker | print', 
                menu : {}, 
                plugins : [ 'paste', 'spellchecker', 'table', 'textcolor', 'advlist', 'autolink', 'link', 'lists', 'print' ], 
                tools: 'inserttable',
                content_css: window.config.rootUri +  '/Content/tinymce.css',
                selector: "textarea.welcomeTextArea"
            });
    },

    cancelWelcomeEdit: function () {
        $('#editMessage').hide();
        $('#welcomeSaveLabel').hide();
        $('#welcomeEditLabel').show();
        $("#WelcomeMessages").show();
    },

    startWelcomeAdd: function () {
        if ($('#editMessage').is(':visible')) {
            this.cancelWelcomeEdit();
            return;
        }

        $('#WelcomeMessages').hide();
        $('#welcomeEditLabel').hide();
        $('#noWelcomeMessage').hide();

        $('#welcomeMessageControl').html('');
        $('#category').val('Welcome');

        $('#editMessage').show();
        $('#welcomeSaveLabel').show();

        this.welcomeId = 0;
    },

    startWelcomeEdit: function (id) {
        $('#WelcomeMessages').hide();
        $('#welcomeEditLabel').hide();

        $('#welcomeMessageControl').html($('#div_WelcomeMessage_' + id).html());
        $('#category').val($('#MenuLink_' + id).text());
        $('#position').val($('#MenuLink_' + id).data("menuposition"));

        $('#editMessage').show();
        $('#welcomeSaveLabel').show();

        this.welcomeId = id;
    },

    deleteWelcome: function (id) {
        var target = this;

        var url = window.config.rootUri + '/api/WelcomeAPI/' + target.accountId;

        if (target.teamId)
            url = url + '/Team/' + target.teamId + '/WelcomeText/' + id;
        else
            url = url + '/WelcomeText/' + id;

        $.ajax({
            type: 'DELETE',
            url: url,
            success: function (dbWelcomeId) {
                window.location.hash = 'update';

                target.cancelWelcomeEdit();
                if (dbWelcomeId != 0) {
                    var menuLink = '#MenuLink_' + dbWelcomeId;

                    $('#div_WelcomeMessageChrome_' + dbWelcomeId).remove();
                    $(menuLink).remove();
                    target.ShowFirstMenu();

                    var menuItems = $(this.menuLinkSelector);
                    if (menuItems.length == 1) {
                        menuItems.hide();
                    }
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + ".");
            }
        });
    },

    saveWelcome: function () {
        var target = this;

        var requestType;
        var url = window.config.rootUri + '/api/WelcomeAPI/' + target.accountId;

        if (target.teamId)
            url = url + '/Team/' + target.teamId + '/WelcomeText';
        else
            url = url + '/WelcomeText';

        if (this.welcomeId == 0) {
            requestType = 'POST'; // new message
        }
        else {
            requestType = 'PUT'; // update existing
            url = url + "/" + this.welcomeId;
        }

        $.ajax({
            type: requestType,
            url: url,
            data: {
                Id: this.welcomeId,
                OrderNo: $('#position').val(),
                AccountId: this.accountId,
                CaptionText: $('#category').val(),
                WelcomeText: $('#welcomeMessageControl').html(),
                TeamId: this.teamId || 0
            },
            success: function (dbWelcomeId) {
                target.cancelWelcomeEdit();
                if (dbWelcomeId != 0) { // if success, can't be 0.
                    if (target.welcomeId != 0) { // edit
                        target.updateWelcomeMessage(dbWelcomeId, target);
                    }
                    else { // new message
                        target.addWelcomeMessage(dbWelcomeId, target);
                    }

                    window.location.hash = 'update';
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    addWelcomeMessage: function (dbWelcomeId, target) {
        var titleLink = $('<a>', {
            'class': 'welcomeMenuItem',
            'id': 'MenuLink_' + dbWelcomeId,
            'data-menuposition': $('#position').val(),
            'href': 'javascript:welcomeData.ShowWelcomeMenu(' + dbWelcomeId + ')',
            'html': $('#category').val()
        });

        titleLink.appendTo($('#WelcomeMessageMenuSection'));

        var welcomeMessageChrome = $('<div>', {
            'id': 'div_WelcomeMessageChrome_' + dbWelcomeId,
            'style': 'display:none',
            'class': 'details'
        });

        if (target.isAdmin) {
            var adminLink = $('<div>', {
                'class': 'grad',
                'style': 'float:right',
                'html': '<a class="btn btn-default" href="javascript:welcomeData.startWelcomeEdit(' + dbWelcomeId + ')"><span class="glyphicon glyphicon-edit"></span></a> <a class="btn btn-danger" href="javascript:welcomeData.deleteWelcome(' + dbWelcomeId + ')"><span class="glyphicon glyphicon-remove"></span></a>'
            });

            adminLink.appendTo(welcomeMessageChrome);
        }

        var welcomeMessage = $('<div>', {
            'id': 'div_WelcomeMessage_' + dbWelcomeId,
            'data-hasdata': 'True',
            'html': $('#welcomeMessageControl').html()
        });

        welcomeMessage.appendTo(welcomeMessageChrome);

        welcomeMessageChrome.appendTo($('#WelcomeMessageDataSection'));

        target.repositionWelcomeMessage(dbWelcomeId, $('#position').val());
    },

    updateWelcomeMessage: function (dbWelcomeId, target) {
        $('#div_WelcomeMessage_' + dbWelcomeId).html($('#welcomeMessageControl').html());
        $('#MenuLink_' + dbWelcomeId).html($('#category').val());

        var oldPosition = $('#MenuLink_' + dbWelcomeId).data("menuposition");
        var newPosition = $('#position').val();

        $('#MenuLink_' + dbWelcomeId).data("menuposition", newPosition);

        if (oldPosition != newPosition)
            target.repositionWelcomeMessage(dbWelcomeId, newPosition);
    },

    repositionWelcomeMessage: function (dbWelcomeId, newPosition) {
        var foundInsert = false;

        $('a[id^="MenuLink_"]').each(function (index, element) {
            
            if (newPosition < $(this).data('menuposition')) {
                $('#MenuLink_' + dbWelcomeId).insertBefore($(this));
                foundInsert = true;
                return false;
            }
        });

        // put at end of list.
        if (!foundInsert) {
            $('#MenuLink_' + dbWelcomeId).appendTo($('#WelcomeMessageMenuSection'));
        }
    },

    ShowWelcomeMenu: function (welcomeTextId) {
        var divId = 'div_WelcomeMessageChrome_' + welcomeTextId;

        var jqueryElement = $('#' + divId);

        // show the content.
        $('.details').hide();
        jqueryElement.show('fast');

        // reset all the styles
        $(this.menuLinkSelector).attr('class', 'welcomeMenuItem');

        // set style for selected item.
        var divMenuId = '#MenuLink_' + welcomeTextId;
        $(divMenuId).attr('class', 'welcomeMenuItemSelected');

        var welcomeMessageElement = $('#div_WelcomeMessage_' + welcomeTextId);

        if (welcomeMessageElement.data('hasdata') == 'False') {

            var url = window.config.rootUri + '/api/WelcomeAPI/' + this.accountId;

            if (this.teamId)
                url = url + '/Team/' + this.teamId;

            url = url + '/WelcomeText/' + welcomeTextId;

            $.ajax({
                type: 'GET',
                url: url,
                success: function (theText) {
                    welcomeMessageElement.html(theText);
                    welcomeMessageElement.data('hasdata', 'True');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            });

        }
    },

    ShowFirstMenu: function () {
        // parse the welcome id from the html id.
        var firstItem = $('.details:first').attr('id');
        if (firstItem != undefined) {
            var firstItemId = firstItem.lastIndexOf('_');
            if (firstItemId != -1) {
                $('#noWelcomeMessage').hide();

                this.ShowWelcomeMenu(firstItem.substring(firstItemId + 1));

                if ($('.details').length == 1) {
                    $(this.menuLinkSelector).hide();
                }
            }
            else {
                $('#noWelcomeMessage').show();;
            }

        }
        else {
            $('#noWelcomeMessage').show();
        }
    }
});

