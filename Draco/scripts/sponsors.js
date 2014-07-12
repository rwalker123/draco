function initSponsorsViewModel(accountId, isAdmin, teamId) {

    var sponsorsElem = document.getElementById("sponsorsView");
    if (sponsorsElem) {
        var sponsorsVM = new SponsorsViewModel(accountId, isAdmin, teamId);
        ko.applyBindings(sponsorsVM, sponsorsElem);
    }
}

var SponsorViewModel = function (data, accountId) {
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

    self.sponsorUploaderUrl = ko.computed(function () {
        var url = window.config.rootUri + '/api/FileUploaderAPI/' + self.accountId;
        if (self.TeamId())
            url = url + '/Team/' + self.TeamId() + '/TeamSponsorLogo/' + self.Id();
        else
            url = url + '/SponsorLogo/' + self.Id();

        return url;
    });


    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

}

var SponsorsViewModel = function (accountId, isAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    self.sponsors = ko.observableArray();
    self.newSponsorTemplate = {
        Id: 0,
        AccountId: self.accountId,
        CityStateZip: '',
        Description: '',
        EMail: '',
        Fax: '',
        Phone: '',
        StreetAddress: '',
        Name: '',
        Website: '',
        TeamId: self.teamId
    };

    self.currentSponsor = ko.observable();

    self.editSponsorMode = ko.observable(false);
    self.enterAddSponsorMode = function () {
        if (self.editSponsorMode())
            self.editSponsorMode(false);
        else {
            self.currentSponsor(new SponsorViewModel(self.newSponsorTemplate, self.accountId));
            self.editSponsorMode(true);
        }
    }

    self.enterEditSponsorMode = function (sponsor) {
        if (self.editSponsorMode())
            self.editSponsorMode(false);
        else {
            self.currentSponsor(new SponsorViewModel(sponsor.toJS(), self.accountId));
            self.editSponsorMode(true);
        }
    }

    self.clearEditValues = function () {
        self.currentSponsor(new SponsorViewModel(self.newSponsorTemplate, self.accountId));
        self.editSponsorMode(false);
    }

    self.submitChanges = function () {
        if (self.currentSponsor().Id() > 0)
            self.updateSponsor(self.currentSponsor().toJS())
        else
            self.addSponsor(self.currentSponsor().toJS());
    }

    self.addSponsor = function (data) {
        var url = window.config.rootUri + '/api/SponsorsAPI/' + self.accountId;

        if (self.teamId) {
            url += '/Team/' + self.teamId + "/teamsponsor";
        }

        $.ajax({
            type: "POST",
            url: url,
            data: data,
            success: function (sponsor) {
                self.sponsors.push(new SponsorViewModel(sponsor, self.accountId));
                self.clearEditValues();
                self.editSponsorMode(false);
            }
        });
    }

    self.promptDeleteSponsor = function (sponsor) {
        $("#deleteSponsorModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.deleteSponsor(sponsor);
        });
    }

    self.deleteSponsor = function (sponsor) {
        var url = window.config.rootUri + '/api/SponsorsAPI/' + self.accountId;

        if (self.teamId) {
            url += '/Team/' + self.teamId + "/teamsponsor/";
        }
        else {
            url += '/sponsor/';
        }

        url += sponsor.Id();

        $.ajax({
            type: "DELETE",
            url: url,
            success: function () {
                self.sponsors.remove(sponsor);
            }
        });
    }

    self.updateSponsor = function (data) {
        var url = window.config.rootUri + '/api/SponsorsAPI/' + self.accountId;

        if (self.teamId) {
            url += '/Team/' + self.teamId + "/teamsponsor/";
        }
        else {
            url += '/sponsor/';
        }

        url += data.Id;

        $.ajax({
            type: "PUT",
            url: url,
            data: data,
            success: function (sponsor) {
                ko.utils.arrayFirst(self.sponsors(), function (s) {
                    if (s.Id() == sponsor.Id) {
                        s.update(sponsor);
                        return false;
                    }

                });

                self.clearEditValues();
                self.editSponsorMode(false);
            }
        });
    }

    self.getSponsors = function () {

        var url = window.config.rootUri + '/api/SponsorsAPI/' + self.accountId;

        if (self.teamId) {
            url += '/Team/' + self.teamId + "/teamsponsor";
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (sponsors) {
                var mappedSponsors = $.map(sponsors, function (sponsor) {
                    return new SponsorViewModel(sponsor, self.accountId);
                });

                self.sponsors(mappedSponsors);
            }
        });

    }

    self.getSponsors();
}