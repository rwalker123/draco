function initAnnouncementsViewModel(accountId, isAdmin, teamId) {

    var announceElem = document.getElementById("announcements");
    if (announceElem) {
        var announceVM = new AnnouncementClass(accountId, isAdmin, teamId);
        ko.applyBindings(announceVM, announceElem);
    }
}

var NewsItemViewModel = function (data) {
    var self = this;

    // mappings to handle special cases in parsing the object.
    self.mapping = {
        // example:
        //'HomeTeamId': {
        //    create: function (options) {
        //        return ko.observable(options.data);
        //    },
        //    update: function (options) {
        //        return options.data;
        //    }
        //}
    }

    ko.mapping.fromJS(data, self.mapping, self);

    self.Date.DisplayDate = ko.computed(function () {
        return moment(new Date(self.Date())).format("MMM DD, YYYY");
    });

    self.Id.isLoaded = ko.observable(self.Text().length > 0);

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var AnnouncementClass = function (accountId, isAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    self.isEditMode = ko.observable(false);
    self.specialNews = ko.observableArray();
    self.otherNews = ko.observableArray();
    self.olderNews = ko.observableArray();
    self.selectedOlderNews = ko.observable();
    self.selectedOlderNews.subscribe(function () {
        if (!self.selectedOlderNews())
            return;
        if (!self.selectedOlderNews().Id.isLoaded())
            self.fillAnnouncementText(self.selectedOlderNews());
    });

    self.allNews = [];

    self.emptyNewsItem = {
        Id: 0,
        AccountId: self.accountId,
        SpecialAnnounce: false,
        Date: moment(new Date()).format("MM/DD/YYYY"),
        Text: '',
        Title: ''
    };

    self.currentEditNews = ko.observable(new NewsItemViewModel(self.emptyNewsItem));

    self.cancelNewsEdit = function () {
        self.isEditMode(false);
    };

    self.startNewsAdd = function (vm) {
        self.currentEditNews().update(self.emptyNewsItem);
        self.isEditMode(!self.isEditMode());
    };

    self.startNewsEdit = function (vm) {
        self.currentEditNews().update(vm.toJS());
        self.isEditMode(true);
        $('html, body').animate({
            scrollTop: $("#editNewsForm").offset().top
        }, 'fast');
    };

    self.saveNews = function () {

        if (!self.currentEditNews())
            return;

        var newItem = self.currentEditNews().Id() == 0;

        var requestType;
        var url = window.config.rootUri + '/api/AnnouncementAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/Announcement';
        else
            url = url + '/Announcement';

        if (newItem) {
            requestType = 'POST'; // new message
        }
        else {
            requestType = 'PUT'; // update existing
            url = url + "/" + self.currentEditNews().Id();
        }

        var data = self.currentEditNews().toJS();

        $.ajax({
            type: requestType,
            url: url,
            data: data,
            success: function (newsItem) {
                window.location.hash = 'update';

                var newsViewModel = new NewsItemViewModel(newsItem);

                if (newItem) {
                    if (newsItem.SpecialAnnounce)
                        self.specialNews.splice(0, 0, newsViewModel);
                    else
                        self.otherNews.splice(0, 0, newsViewModel);

                    self.allNews.push(newsViewModel);
                }
                else {
                    var originalItem = ko.utils.arrayFirst(self.allNews, function (item) {
                        return item.Id() == newsItem.Id;
                    });

                    if (originalItem) {
                        if (originalItem.SpecialAnnounce()) {
                            if (!newsItem.SpecialAnnounce) { // was special announce, now isn't...
                                self.specialNews.remove(originalItem);
                                self.otherNews.splice(0, 0, originalItem);
                            }
                        }
                        else {
                            if (newsItem.SpecialAnnounce) { // move to special
                                self.specialNews.splice(0, 0, originalItem);
                                // remove from other and older news, will only be in one.
                                var isOther = self.otherNews.remove(originalItem);
                                if (!isOther || isOther.length == 0)
                                    self.olderNews.remove(originalItem);
                            }
                        }

                        originalItem.update(newsItem);
                    }
                }

                self.updateOtherNews();
                self.cancelNewsEdit();
            }
        });
    };

    self.updateOtherNews = function () {
        if (self.otherNews().length < 3) {
            if (self.olderNews().length > 0) {
                self.otherNews.push(self.olderNews.shift());
            }
        }
        if (self.otherNews().length > 3) {
            self.olderNews.splice(0, 0, self.otherNews.pop());
        }
    }

    self.deleteNews = function (vm) { 

        var url = window.config.rootUri + '/api/AnnouncementAPI/' + self.accountId;
        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/Announcement/' + vm.Id();
        else
            url = url + '/Announcement/' + vm.Id();

        $.ajax({
            type: 'DELETE',
            url: url,
            success: function (dbNewsId) {
                window.location.hash = 'update';

                self.allNews.splice(self.allNews.indexOf(vm), 1);
                var isOlder = self.olderNews.remove(vm);
                if (!isOlder || isOlder.length == 0) {
                    var isOther = self.otherNews.remove(vm);
                    if (!isOther || isOther.length == 0)
                        self.specialNews.remove(vm);
                    else
                        self.updateOtherNews();
                }

            }
        });
    };

    self.loadAnnouncements = function () {

        var url = window.config.rootUri + '/api/AnnouncementAPI/' + self.accountId;
        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/TeamAnnouncements';
        else
            url = url + '/Announcements';

        $.ajax({
            type: 'GET',
            url: url,
            success: function (announcements) {
                var mappedSpecial = $.map(announcements.SpecialNews, function (item) {
                    return new NewsItemViewModel(item);
                });

                self.specialNews(mappedSpecial);

                var mappedOther = $.map(announcements.OtherNews, function (item) {
                    return new NewsItemViewModel(item);
                });

                self.otherNews(mappedOther);
                self.allNews = mappedSpecial.concat(mappedOther);

                var mappedOlder = $.map(announcements.OlderNews, function (item) {
                    return new NewsItemViewModel(item);
                });

                self.olderNews(mappedOlder);
                self.allNews = self.allNews.concat(mappedOlder);
            }
        });
    };

    self.fillAnnouncementText = function (vm) {
        var url = window.config.rootUri + '/api/AnnouncementAPI/' + self.accountId;
        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/Announcement/';
        else
            url = url + '/Announcement/';

        url = url + vm.Id();

        $.ajax({
            type: 'GET',
            url: url,
            success: function (announcement) {
                vm.Text(announcement.Text);
                vm.Id.isLoaded(true);
            }
        });
    }

    $('#otherNewsSection').on('shown.bs.collapse', function () {

        //get the anchor of the accordian that does not has the class "collapsed"
        var openAnchor = $(this).find('a[data-toggle=collapse]:not(.collapsed)');
        if (openAnchor && openAnchor.length == 1) {
            var vm = ko.dataFor(openAnchor[0]);
            if (vm && !vm.Id.isLoaded()) {
                self.fillAnnouncementText(vm);
            }
        }
    });

    self.loadAnnouncements();
}
