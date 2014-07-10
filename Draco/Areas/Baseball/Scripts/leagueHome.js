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

var AccountViewModel = function (data) {

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


    self.hasYear = ko.computed(function () {
        return !!self.FirstYear();
    });

    self.fileUploaderUrl = ko.computed(function () {
        return window.config.rootUri + '/api/FileUploaderAPI/' + self.Id() + '/AccountLargeLogo';
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

// edit account name
var EditAccountNameViewModel = function (accountId, accountName, firstYear, twitterAccountName) {
    var self = this;
    self.accountId = accountId;

    self.accountViewModel = ko.observable(new AccountViewModel({
        Id: self.accountId,
        AccountName: accountName,
        FirstYear: firstYear,
        TwitterAccountName: twitterAccountName,
        LargeLogoURL: window.config.rootUri + "/Uploads/Accounts/" + self.accountId + "/Logo/LargeLogo.png"
    }));

    self.editAccountInfo = ko.observable(new AccountViewModel(self.accountViewModel().toJS()));

    self.viewMode = ko.observable(true);

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

    self.editAccount = function () {
        self.viewMode(false);
    }
    self.saveAccount = function () {

        var url = window.config.rootUri + '/api/AccountAPI/' + accountId + '/AccountName';

        data = self.editAccountInfo().toJS();

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (accountName) {
                if (self.accountViewModel().TwitterAccountName() != self.editAccountInfo().TwitterAccountName())
                    window.location.reload();
                else {
                    self.accountViewModel().update(data);
                    self.viewMode(true);
                    window.location.hash = 'update';
                }
            }
        });
    }

    self.cancelEdit = function () {
        self.editAccountInfo().update(self.accountViewModel().toJS());
        self.viewMode(true);
    }

    $('#largelogoupload').fileupload({
        url: window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId + '/AccountLargeLogo',
        dataType: 'json',
        done: function (e, data) {
            var seconds = new Date().getTime() / 1000;
            self.accountViewModel().LargeLogoURL(data.result + "?" + seconds);
            //$("#largeLogoImage").attr("src", data.result + "?" + seconds);
        },
        progressall: function (e, data) {
            //var progress = parseInt(data.loaded / data.total * 100, 10);
            //$('#progress .progress-bar').css(
            //    'width',
            //    progress + '%'
            //);
        }
    }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');

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

