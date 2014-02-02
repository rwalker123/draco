function InitViewModels(accountId, accountName, firstYear, twitterAccountName, facebookFanPage, showPhotoGallery, isAdmin ) {
    var editAccountVM = new EditAccountNameViewModel(accountId, accountName, firstYear, twitterAccountName);
    ko.applyBindings(editAccountVM, document.getElementById("accountName"));

    var twitterFeed = document.getElementById("twitterFeed");
    if (twitterFeed) {
        var twitterVM = new TwitterViewModel(accountId, isAdmin);
        ko.applyBindings(twitterVM, twitterFeed);
        twitterVM.loadTwitterScript();
    }

    var facebookFeed = document.getElementById("facebookFeed");
    if (facebookFeed) {
        var facebookVM = new FacebookViewModel(accountId, facebookFanPage, isAdmin);
        ko.applyBindings(facebookVM, facebookFeed);
    }

    $('#fileupload').fileupload({
        dataType: 'json',
        formData: {
            Id: 0,
            Title: 'title',
            Caption: 'caption',
            AlbumId: -1
        },
        add: function (e, data) {
            data.context = $('<button/>').text('Upload')
                .appendTo($('#pg'))
                .click(function () {
                    data.context = $('<p/>').text('Uploading...').replaceAll($(this));
                    data.submit();
                });
        },
        fail: function (e, data) {
            alert(data.errorThrown);
        },
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
                $('<p/>').text(file.name).appendTo(document.body);
            });
        }
    });

    if (showPhotoGallery) {
        var photoGalleryVM = new PhotoGalleryViewModel(accountId, isAdmin);
        ko.applyBindings(photoGalleryVM, document.getElementById("photoGallery"));
    }
}

// edit account name
var EditAccountNameViewModel = function (accountId, accountName, firstYear, twitterAccountName) {
    var self = this;
    self.accountId = accountId;

    self.name = ko.protectedObservable(accountName);
    self.firstYear = ko.protectedObservable(firstYear);
    self.twitterAccount = ko.protectedObservable(twitterAccountName);
    self.viewMode = ko.observable(true);
    self.hasYear = ko.computed(function() {
        return !!self.firstYear;
    });

    self.availableYears = [];

    self.fillYears = function() {
        var numYears = 100;
        var dt = (new Date()).getFullYear();

        for (var i = 0; i < numYears; ++i)
        {
            self.availableYears.push(dt);
            --dt;
        }
    }

    self.fillYears();

    self.editAccountName = function () {
        self.viewMode(false);
    }
    self.saveAccountName = function () {

        $.ajax({
            type: "PUT",
            url: '/api/AccountAPI/' + accountId + '/AccountName',
            data: {
                Id: self.name.uncommitValue(),
                Year: self.firstYear.uncommitValue(),
                TwitterAccount: self.twitterAccount.uncommitValue()
            },
            success: function (accountName) {
                if (self.twitterAccount.uncommitValue() != self.twitterAccount())
                    window.location.reload();
                else {
                    self.commitChanges();
                    self.viewMode(true);
                    window.location.hash = 'update';
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                var obj = JSON.parse(xhr.responseText);
                alert(obj.ExceptionMessage);
            }
        });
    }

    self.cancelEdit = function () {
        self.resetChanges();
        self.viewMode(true);
    }


    self.commitChanges = function () {
        self.doAction(self, "commit");
        self.doAction(self.details, "commit");
    }

    self.resetChanges = function () {
        self.doAction(self, "reset");
        self.doAction(self.details, "reset");
    }

    self.doAction = function (target, action) {
        for (var key in target) {
            var prop = target[key];
            if (ko.isWriteableObservable(prop) && prop[action]) {
                prop[action]();
            }
        }
    }
}

// twitter view model
var TwitterViewModel = function (accountId, isAdmin) {
    var self = this;
    
    self.accountId = accountId;
    self.isAdmin = isAdmin;

    // twitter script displayed in input field.
    self.twitterScript = ko.observable();

    // twitter script in div element that renders the twitter page.
    self.htmlTwitterScript = ko.observable();

    self.displayTwitterFeed = ko.computed(function () {
        return (self.isAdmin || self.htmlTwitterScript())
    }, self);

    self.loadTwitterScript = function () {
        $.ajax({
            type: "GET",
            dataType: "json",
            url: '/api/AccountAPI/' + self.accountId + '/TwitterScript',
            success: function (data) {
                self.htmlTwitterScript(data);
                setTimeout(function () {
                    twttr.widgets.load();
                }, 1000);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.saveTwitterScript = function () {
        $.ajax({
            type: "PUT",
            dataType: "json",
            url: '/api/AccountAPI/' + self.accountId + '/SaveTwitterScript',
            data: {
                Script: self.twitterScript()
            },
            success: function (data) {
                self.htmlTwitterScript(self.twitterScript());
                twttr.widgets.load();
                self.twitterScript('');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert("Caught error: Status: " + jqXHR.status + ". Error: " + errorThrown);
            }
        });
    }
}

// facebook fan page
var FacebookViewModel = function (accountId, fanPage, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.isEditMode = ko.observable(false);

    self.fanPage = ko.observable(fanPage);
    self.editFanPage = ko.observable(fanPage);

    self.fanPageUrl = ko.computed(function () {
        return 'http://www.facebook.com/' + self.fanPage();
    }, self);

    self.isVisible = ko.computed(function () {
        return (self.fanPage() || self.isAdmin);
    }, self);

    self.saveFanPage = function () {
        self.fanPage(self.editFanPage);
    }

    self.cancelSaveFanPage = function () {
        self.editFanPage(self.fanPage);
    }
}

// you tube view model
var youTubeViewModel = function(accountId, id) {
    var self = this;

    self.accountId = accountId;

    // declare ko stuff here, otherwise it is static to the class.
    self.userId = ko.observable(id);
    self.viewMode = ko.observable(true);
    self.videosVisible = ko.observable(true); 
    self.viewUserId = ko.computed(function() {
        if (!self.userId()) {
            return '{enter a YouTube id}';
        }

        return self.userId();
    }, this);

    self.editYouTube = function () {
        self.savedId = self.userId();
        self.viewMode(false);
    }

    self.saveUserId = function () {
        $.ajax({
            type: "PUT",
            url: '/api/AccountAPI/' + self.accountId + '/YouTubeUserId',
            data: {
                Id: self.userId()
            },
            success: function (userId) {
                loadVideos(userId);
                self.viewMode(true);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.resetUserId = function () {
        self.userId(self.savedId);
        self.viewMode(true);
    }
}

var PhotoGalleryViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.viewMode = ko.observable(true);

    self.photoGalleryVisible = ko.observable(true);

    self.fileUploaderUrl = ko.computed(function () {
        return '/api/FileUploaderAPI/' + self.accountId + '/PhotoGallery';
    }, self);
}


