function initTwitterViewModel(accountId, isAdmin) {

    var twitterFeed = document.getElementById("twitterFeed");
    if (twitterFeed) {
        var twitterVM = new TwitterViewModel(accountId, isAdmin);
        ko.applyBindings(twitterVM, twitterFeed);
        twitterVM.loadTwitterScript();
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

