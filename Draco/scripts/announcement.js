var AnnouncementClass = function (accountId, isAdmin, teamId) {
    this.init(accountId, isAdmin, teamId);
};

$.extend(AnnouncementClass.prototype, {

    newsId: 0,
    dateFormat: "M d, yy",

    init: function (accountId, isAdmin, teamId) {
        this.accountId = accountId;
        this.isAdmin = isAdmin;
        this.teamId = teamId;

        $('#newsEditControl').tinymce({ selector: "textarea.newsEditor" });

    },

    cancelNewsEdit: function () {
        $('#editNews').hide();
        $('#newsSaveLabel').hide();
        $('#newsEditLabel').show();
        $("#NewsItems").show();
    },


    startNewsAdd: function () {
        $('#NewsItems').hide();
        $('#newsEditLabel').hide();
        $('#noHeadlinesMessage').hide();

        $('#newsEditControl').html('');
        $('#newsTitle').val('');
        $('#specialAnnounce').prop('checked', false);

        $('#editNews').show();
        $('#newsSaveLabel').show();

        this.newsId = 0;
    },

    startNewsEdit: function (id) {
        $('#NewsItems').hide();
        $('#newsEditLabel').hide();
        $('#noHeadlinesMessage').hide();

        // find the title
        var specialElem = $('#specialAnnounceSection > #div_NewsItemChrome_' + id);
        var isSpecial = (specialElem.length > 0);
        if (isSpecial) {
            $('#newsTitle').val($('#specialNewsTitle_' + id).html());
            $('#newsEditControl').html($('#specialNewsItem_' + id).html());
        }
        else {
            var otherElem = $('#OtherNewsTitle_' + id);
            var isOther = (otherElem.length > 0);
            if (isOther) {
                $('#newsTitle').val(otherElem.html());
            }
            else {
                $('#newsTitle').val($('#OlderNewsTitle_' + id).html());
            }

            $('#newsEditControl').html($('#div_NewsItem_' + id).html());
        }

        $('#specialAnnounce').prop('checked', isSpecial);

        $('#editNews').show();
        $('#newsSaveLabel').show();

        this.newsId = id;
    },

    saveNews: function () {
        var target = this;

        var requestType;
        var url = window.config.rootUri + '/api/AnnouncementAPI/' + this.accountId;

        if (this.teamId)
            url = url + '/Team/' + this.teamId + '/Announcement';
        else
            url = url + '/Announcement';

        if (this.newsId == 0) {
            requestType = 'POST'; // new message
        }
        else {
            requestType = 'PUT'; // update existing
            url = url + "/" + this.newsId;
        }

        $.ajax({
            type: requestType,
            url: url,
            data: {
                Id: this.newsId,
                AccountId: this.teamId || this.accountId,
                Title: $('#newsTitle').val(),
                SpecialAnnounce: $('#specialAnnounce').is(':checked'),
                Text: $('#newsEditControl').html()
            },
            success: function (dbNewsId) {
                window.location.hash = 'update';

                target.cancelNewsEdit();
                var theNewsDate = $.datepicker.formatDate(target.dateFormat, new Date());
                var specialAnnounce = $('#specialAnnounce').is(':checked');
                if (requestType == 'POST') { // "POST" for new item.
                    if (specialAnnounce) {
                        target.saveSpecialAnnounce(dbNewsId, theNewsDate, target);
                    }
                    else {
                        target.saveOtherNews(dbNewsId, theNewsDate, target);
                    }
                }
                else { // "PUT" for edit item.
                    // was special selected.
                    var curSpecial = $('#specialAnnounce').is(':checked');
                    var prevSpecial = $('#specialNewsTitle_' + dbNewsId).length > 0;

                    var isOther = $('#OtherNewsTitle_' + dbNewsId).length > 0;
                    var isOlder = $('#OlderNewsTitle_' + dbNewsId).length > 0;
                    
                    // if special changed, have to move to new group based on date.
                    if (curSpecial && !prevSpecial) {
                        // move to special
                        if (isOther) {
                            // move from other to special
                            target.moveOtherToSpecial(dbNewsId, target);
                            // update 
                            target.updateSpecial(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html(), target);
                        }
                        else if (isOlder) {
                            // move from older to special
                            target.moveOlderToSpecial(dbNewsId, target);
                            // update
                            target.updateSpecial(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html(), target);
                        }
                    }
                    else if (!curSpecial && prevSpecial) {
                        // remove from special add to top of other.
                        target.updateSpecial(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html());
                        target.moveSpecialToOther(dbNewsId, target);
                    }
                    else if (curSpecial) {
                        // update special
                        target.updateSpecial(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html());
                    }
                    else if (isOther) {
                        // update other
                        target.updateOther(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html(), target);
                    }
                    else if (isOlder) {
                        // update older
                        target.updateOlder(dbNewsId, $('#newsTitle').val(), $('#newsEditControl').html(), target);
                    }
                }

                target.AdjustNewsMenuHeaders();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    },

    deleteNews: function (id) {
        var target = this;

        var url = window.config.rootUri + '/api/AnnouncementAPI/' + this.accountId;
        if (this.teamId)
            url = url + '/Team/' + this.teamId + '/Announcement/' + id;
        else
            url = url + '/Announcement/' + id;

        $.ajax({
            type: 'DELETE',
            url: url,
            success: function (dbNewsId) {
                window.location.hash = 'update';

                target.cancelNewsEdit();

                if (dbNewsId == 0)
                    return;

                var theElement = $('#div_NewsItem_' + dbNewsId);

                if (theElement.parents('#specialAnnounceSection').length > 0)
                    target.deleteSpecialNews(dbNewsId);
                else if (theElement.parents('#otherNewsSection').length > 0)
                    target.deleteOtherNews(dbNewsId, target);
                else if (theElement.parents('#olderNewsSection').length > 0)
                    target.deleteOlderNews(dbNewsId);
                else
                    location.reload();

                target.AdjustNewsMenuHeaders();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError + ".");
            }
        });
    },

    AdjustNewsMenuHeaders: function () {
        // adjust the 'Other' header.
        var hasOther = $('.otherNewsMenuItem').length > 0;
        if (hasOther)
            $('#otherNewsHeader').show();
        else
            $('#otherNewsHeader').hide();

        var hasOlder = $('.olderNewsMenuItem').length > 0;
        if (hasOlder)
            $('#olderNewsHeader').show();
        else
            $('#olderNewsHeader').hide();

        var hasSpecial = $('.newsSpecial').length > 0;
        if (!hasOther && !hasOlder && !hasSpecial) {
            $('#noHeadlinesMessage').show();
        }
        else {
            $('#noHeadlinesMessage').hide();
        }
    },

    ShowNewsMenu: function (newsId) {
        var divId = 'div_NewsItemChrome_' + newsId;

        var jqueryElement = $('#' + divId);

        if (jqueryElement.is(":visible")) {
            jqueryElement.hide();
            return;
        }

        // show the content.
        $('.newsdetails').hide();
        jqueryElement.show('fast');

        // reset all the styles
        $(this.menuLinkSelector).attr('class', 'newsMenuItem');

        var newsItemElement = $('#div_NewsItem_' + newsId);

        if (newsItemElement.data('hasdata') == 'False') {

            var url = window.config.rootUri + '/api/AnnouncementAPI/' + this.accountId;
            if (this.teamId)
                url = url + '/Team/' + this.teamId + '/Announcement/';
            else
                url = url + '/Announcement/';
            
            url = url + newsId;

            $.ajax({
                type: 'GET',
                url: url,
                success: function (theText) {
                    newsItemElement.html(theText);
                    newsItemElement.data('hasdata', 'True');
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
                }
            });
        }
    },

    saveSpecialAnnounce: function (dbNewsId, theNewsDate, target) {
        var chromeElement = $('<div>', {
            'id': 'div_NewsItemChrome_' + dbNewsId,
            'class': 'newsSpecial'
        });

        if (target.isAdmin) {
            var adminMenu = target.createAdminMenu(dbNewsId);
            adminMenu.appendTo(chromeElement);
        }

        var newsElement = $('<div>', {
            'id': 'div_NewsItem_' + dbNewsId,
            'data-hasdata': 'True',
            'data-newsdate': theNewsDate,
            'html': '<h1>' + $('#newsTitle').val() + '</h1>' + $('#newsEditControl').html()
        });

        newsElement.appendTo(chromeElement);

        chromeElement.prependTo($('#specialAnnounceSection'));
    },

    saveOtherNews: function (dbNewsId, theNewsDate, target) {

        var title = $('#newsTitle').val();
        var data = $('#newsEditControl').html();
        target.createOtherNewsItem(dbNewsId, theNewsDate, title, data, target);
    },

    updateSpecial: function (dbNewsId, title, text) {
        $('#specialNewsTitle_' + dbNewsId).html(title);
        $('#specialNewsItem_' + dbNewsId).html(text);
    },

    updateOther: function (dbNewsId, title, text, target) {
        $('#OtherNewsTitle_' + dbNewsId).html(title);
        $('#div_NewsItem_' + dbNewsId).html(text);

        // toggle it off.
        target.ShowNewsMenu(dbNewsId);

        // move to top, date is changed.
        $('#div_NewsItemChrome_' + dbNewsId).prependTo($('#otherNewsSection'));
        $('#OtherNewsMenuLink_' + dbNewsId).prependTo($('#otherNewsSection'));

        // toggle it back on.
        target.ShowNewsMenu(dbNewsId);
    },

    updateOlder: function (dbNewsId, title, text, target) {
        $('#OlderNewsTitle_' + dbNewsId).html(title);
        $('#div_NewsItem_' + dbNewsId).html(text);

        // toggle it off.
        target.ShowNewsMenu(dbNewsId);

        target.moveOlderToOther(dbNewsId, false, target);
        target.moveExtraOtherToOlder();

        target.ShowNewsMenu(dbNewsId);
    },

    deleteSpecialNews: function (dbNewsId) {
        $('#div_NewsItemChrome_' + dbNewsId).remove();
    },

    deleteOtherNews: function (dbNewsId, target) {
        // other News menu item.
        target.moveFirstOlderToOther(target);

        $('#OtherNewsMenuLink_' + dbNewsId).remove();
        $('#div_NewsItemChrome_' + dbNewsId).remove();
    },

    createAdminMenu: function(dbNewsId) {
        return ($('<div>', {
            'class': 'grad',
            'style': 'float:right',
            'html': '<a class="btn btn-default" href="javascript:announcementData.startNewsEdit(' + dbNewsId + ')"><span class="glyphicon glyphicon-edit"></span></a> <a class="btn btn-danger" href="javascript:announcementData.deleteNews(' + dbNewsId + ')"><span class="glyphicon glyphicon-remove"></span></a></div>'
        }));
    },

    createSpecialNews: function (dbNewsId, title, content, target) {

        var chromeElement = $('<div>', {
            'id': 'div_NewsItemChrome_' + dbNewsId,
            'class': 'newsSpecial'
        });

        if (target.isAdmin) {
            var adminMenu = target.createAdminMenu(dbNewsId);
            adminMenu.appendTo(chromeElement);
        }

        var newsItemElement = $('<div>', {
            'id': 'div_NewsItem_' + dbNewsId,
            'data-hasdata': 'True',
            'data-newsdate': $.datepicker.formatDate(target.dateFormat, new Date())
        });

        newsItemElement.appendTo(chromeElement);

        var newsHeader = $('<h1>', {
            'id': 'specialNewsTitle_' + dbNewsId,
            'html': title
        });

        newsHeader.appendTo(newsItemElement);

        var newsContent = $('<div>', {
            'id': 'specialNewsItem_' + dbNewsId,
            'html': content
        });

        newsContent.appendTo(chromeElement);

        chromeElement.prependTo($('#specialAnnounceSection'));
    },

    createOtherMenuHeader: function (dbNewsId, theNewsDate, title) {
        return ($('<h3>', {
            'class': 'newsMenuItem, otherNewsMenuItem',
            'id': 'OtherNewsMenuLink_' + dbNewsId,
            'html': theNewsDate + ' <a id="OtherNewsTitle_' + dbNewsId + '" href="javascript:announcementData.ShowNewsMenu(' + dbNewsId + ')">' + title + '</a>'
        }));
    },

    createOtherNewsItem: function (dbNewsId, theNewsDate, title, data, target) {
        var otherNewsSection = $('#otherNewsSection');

        // add to top of Other News, if other news size > 3, remove last one and move to front of older news.
        var chromeElement = $('<div>', {
            'id': 'div_NewsItemChrome_' + dbNewsId,
            'style': 'display:none',
            'class': 'newsdetails'
        });

        var menuItemElement = target.createOtherMenuHeader(dbNewsId, theNewsDate, title);

        if (target.isAdmin) {
            var adminMenu = target.createAdminMenu(dbNewsId);
            adminMenu.appendTo(chromeElement);
        }

        var newsElement;
        
        if (data) {
            newsElement = $('<div>', {
                'id': 'div_NewsItem_' + dbNewsId,
                'data-hasdata': 'Talse',
                'data-newsdate': theNewsDate,
                'html': data
            });
        }
        else {
            newsElement = $('<div>', {
                'id': 'div_NewsItem_' + dbNewsId,
                'data-hasdata': 'False',
                'data-newsdate': theNewsDate
            });
        }

        newsElement.appendTo(chromeElement);

        chromeElement.prependTo(otherNewsSection);
        menuItemElement.prependTo(otherNewsSection);

        // remove last item from other news and move to older news...
        if ($('#otherNewsSection > .newsdetails').length > 3) {
            target.moveExtraOtherToOlder();
        }
    },

    moveExtraOtherToOlder: function () {
        var id = $('#otherNewsSection > .newsdetails').last().attr('id').split('_')[2];

        var olderNewsMenu = $('<a>', {
            'class': 'newsMenuItem, olderNewsMenuItem',
            'style': 'padding: 10px',
            'id': 'OlderNewsTitle_' + id,
            'href': 'javascript:announcementData.ShowNewsMenu(' + id + ')',
            'html': $('#OtherNewsTitle_' + id).html()
        });

        $('#OtherNewsMenuLink_' + id).remove();
        // move to older section
        $('#div_NewsItemChrome_' + id).prependTo($('#olderNewsSection'));
        olderNewsMenu.prependTo(('#olderNewsMenuSection'));
    },

    moveOlderToOther: function (olderNewsId, append, target) {

        // move the first older menu item to other.
        // find older item, update tags, move to older
        var title = $('#OlderNewsTitle_' + olderNewsId).html();
        var theNewsDate = $('#div_NewsItem_' + olderNewsId).data('newsdate');
        var menuHeader = target.createOtherMenuHeader(olderNewsId, theNewsDate, title);

        if (append) {
            menuHeader.appendTo($('#otherNewsSection'));
            $('#div_NewsItemChrome_' + olderNewsId).appendTo($('#otherNewsSection'));
        }
        else {
            $('#div_NewsItemChrome_' + olderNewsId).prependTo($('#otherNewsSection'));
            menuHeader.prependTo($('#otherNewsSection'));
        }

        $('#OlderNewsTitle_' + olderNewsId).remove();
    },

    moveFirstOlderToOther: function(target) {
        if ($('.olderNewsMenuItem').length > 0) {
            var olderNewsId = $('.olderNewsMenuItem').first().attr('id').split('_')[1];
            target.moveOlderToOther(olderNewsId, true, target);
        }
    },

    moveOlderToSpecial: function (olderNewsId, target) {

        var newsTitleElement = $('#OlderNewsTitle_' + olderNewsId);
        var newsTitle = newsTitleElement.html();

        target.moveToSpecial(olderNewsId, newsTitle, newsTitleElement, target);
    },

    moveOtherToSpecial: function (otherNewsId, target) {

        var newsTitle = $('#OtherNewsTitle_' + otherNewsId).html();
        var newsMenuElement = $('#OtherNewsMenuLink_' + otherNewsId);
        target.moveToSpecial(otherNewsId, newsTitle, newsMenuElement, target);

        target.moveFirstOlderToOther(target);
    },

    moveToSpecial: function(dbNewsId, newsTitle, newsMenuElement, target) {

        // toggle it off.
        target.ShowNewsMenu(dbNewsId);

        var newsData = $('#div_NewsItem_' + dbNewsId).html();

        newsMenuElement.remove();
        $('#div_NewsItemChrome_' + dbNewsId).remove();

        target.createSpecialNews(dbNewsId, newsTitle, newsData, target);
    },

    moveSpecialToOther: function (dbNewsId, target) {

        var title = $('#specialNewsTitle_' + dbNewsId).html();
        var theNewsDate = $.datepicker.formatDate(target.dateFormat, new Date());
        var data = $('#specialNewsItem_' + dbNewsId).html();

        $('#div_NewsItemChrome_' + dbNewsId).remove();

        target.createOtherNewsItem(dbNewsId, theNewsDate, title, data, target);
    },

    deleteOlderNews: function (dbNewsId) {
        // older news menu item.
        $('#OlderNewsTitle_' + dbNewsId).remove();
        $('#div_NewsItemChrome_' + dbNewsId).remove();
    }
});
