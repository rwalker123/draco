function InitViewModels(accountId, accountName, firstYear, twitterAccountName, accountLogoUrl) {
    var editAccountVM = new EditAccountNameViewModel(accountId, accountName, firstYear, twitterAccountName, accountLogoUrl);
    ko.applyBindings(editAccountVM, document.getElementById("accountName"));
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

    self.accountLogoUploaderUrl = ko.computed(function () {
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
var EditAccountNameViewModel = function (accountId, accountName, firstYear, twitterAccountName, accountLogoUrl) {
    var self = this;
    self.accountId = accountId;

    self.accountViewModel = ko.observable(new AccountViewModel({
        Id: self.accountId,
        AccountName: accountName,
        FirstYear: firstYear,
        TwitterAccountName: twitterAccountName,
        LargeLogoURL: accountLogoUrl
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

