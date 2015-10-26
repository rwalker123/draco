function InitSponsorSpotlightViewModel(accountId, teamSeasonId) {

    var sponsorSpotlightViewElem = document.getElementById("sponsorSpotlightView");
    if (sponsorSpotlightViewElem) {
        var sponsorSpotlightViewVM = new SponsorsSpotlightViewModel(accountId, teamSeasonId);
        ko.applyBindings(sponsorSpotlightViewVM, sponsorSpotlightViewElem);
    }
}

var SponsorSpotlightViewModel = function (data, accountId) {
    var self = this;

    self.accountId = accountId;

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

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}
var SponsorsSpotlightViewModel = function (accountId, teamSeasonId) {
    var self = this;

    self.accountId = accountId;
    self.teamSeasonId = teamSeasonId;

    self.isLoading = ko.observable(true);

    self.sponsor = ko.observable();

    self.loadSpotlightSponsor = function () {

        var url = window.config.rootUri + '/api/SponsorsAPI/' + self.accountId;

        if (self.teamSeasonId)
            url = url + '/randomteamsponsor/' + self.teamSeasonId;
        else
            url = url + '/randomsponsor';

        $.ajax({
            type: "GET",
            url: url,
            success: function (randomSponsor) {
                self.sponsor(new SponsorSpotlightViewModel(randomSponsor, self.accountId));
                self.isLoading(false);
            },
            error: function () {
                self.isLoading(false);
            }
        });
    }

    self.loadSpotlightSponsor();
}