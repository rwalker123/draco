function initFacebookViewModel(accountId, facebookFanPage, isAdmin) {

    var facebookFeed = document.getElementById("facebookFeed");
    if (facebookFeed) {
        var facebookVM = new FacebookViewModel(accountId, facebookFanPage, isAdmin);
        ko.applyBindings(facebookVM, facebookFeed);
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
        return 'https://www.facebook.com/' + self.fanPage();
    }, self);

    self.isVisible = ko.computed(function () {
        return (self.fanPage() || self.isAdmin);
    }, self);

    self.saveFanPage = function () {
        self.fanPage(self.editFanPage());
    }

    self.cancelSaveFanPage = function () {
        self.editFanPage(self.fanPage());
    }
}

