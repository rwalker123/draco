function InitViewModels(accountId, accountName, firstYear, twitterAccountName, facebookFanPage, isAdmin ) {
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

        var url = window.config.rootUri + '/api/AccountAPI/' + accountId + '/AccountName';
        $.ajax({
            type: "PUT",
            url: url,
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

        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/TwitterScript';
        $.ajax({
            type: "GET",
            dataType: "json",
            url: url,
            success: function (data) {
                self.htmlTwitterScript(data);
                setTimeout(function () {
                    twttr.widgets.load();
                }, 1000);
            }
        });
    }

    self.saveTwitterScript = function () {
        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/SaveTwitterScript';

        $.ajax({
            type: "PUT",
            dataType: "json",
            url: url,
            data: {
                Script: self.twitterScript()
            },
            success: function (data) {
                self.htmlTwitterScript(self.twitterScript());
                twttr.widgets.load();
                self.twitterScript('');
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
        var url = window.config.rootUri + '/api/AccountAPI/' + self.accountId + '/YouTubeUserId';

        $.ajax({
            type: "PUT",
            url: url,
            data: {
                Id: self.userId()
            },
            success: function (userId) {
                loadVideos(userId);
                self.viewMode(true);
            }
        });
    }

    self.resetUserId = function () {
        self.userId(self.savedId);
        self.viewMode(true);
    }
}

