function initSeasonData(accountId) {
    initKOHelpers();

    var seasonSetupElem = document.getElementById("seasonsetup");
    if (seasonSetupElem) {
        var seasonSetupVM = new SeasonSetupViewModel(accountId);
        ko.applyBindings(seasonSetupVM, seasonSetupElem);
    }

}

var SeasonViewModel = function(data, accountId) {
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

    self.Id.deleting = ko.observable(false);

    self.Name.extend({
        email: true
    });

    self.Name.subscribe(function () {
        if (!self.Name())
            return;

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/Season/' + self.Id(),
            data: {
                AccountId: self.accountId,
                Name: self.Name()
            },
            success: function (seasonId) {
            }
        });
    });


    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var SeasonSetupViewModel = function (accountId) {
    var self = this;

    self.accountId = accountId;
    self.seasons = ko.observableArray();

    self.fillSeasons = function () {
        $.getJSON(window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/Seasons',
			function (data) {
			    var mappedSeasons = $.map(data, function (season) {
			        return new SeasonViewModel(season, self.accountId);
			    });

			    self.seasons(mappedSeasons);
			    self.seasons.sort(self.sortBySeasonName);

			    self.setCurrentSeasonDisplay();
			});
    };

    self.newSeasonName = ko.observable();

    self.addSeason = function () {
        if (!self.newSeasonName())
            return;

        $.ajax({
            type: "POST",
            url: window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/Season/',
            data: {
                AccountId: self.accountId,
                Name: self.newSeasonName()
            },
            success: function (seasonData) {

                var seasonvm = new SeasonViewModel({
                    Id: seasonData.Id,
                    Name: seasonData.Name
                }, self.accountId);

                self.seasons.push(seasonvm);
                self.seasons.sort(self.sortBySeasonName);

                self.newSeasonName("");
                self.setCurrentSeasonDisplay();
            }
        });
    };

    self.sortBySeasonName = function (l, r) {
        var lName = l.Name();
        var rName = r.Name();
        return lName == rName ? 0 : (lName < rName ? -1 : 1);
    }

    self.deleteSeason = function (seasonVM) {
        $("#myModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.makeDeleteCall(seasonVM);
        });
    };

    self.makeDeleteCall = function (seasonVM) {

        seasonVM.Id.deleting(true);

        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/Season/' + seasonVM.Id(),
            success: function (deletedSeasonId) {
                self.seasons.remove(seasonVM);
                self.setCurrentSeasonDisplay();
            },
            complete: function () {
                seasonVM.Id.deleting(false);
            }
        });

    };

    self.setCurrentSeason = function (seasonVM) {

        $.ajax({
            type: "PUT",
            url: window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/CurrentSeason/' + seasonVM.Id(),
            success: function (currentSeasonId) {
                self.setCurrentSeasonDisplay();
            }
        });

    };

    self.currentSeason = ko.observable();

    self.setCurrentSeasonDisplay = function () {

        $.getJSON(window.config.rootUri + '/api/SeasonsAPI/' + self.accountId + '/CurrentSeason',
            function (data) {
                if (data.HasSeasons) {
                    if (data.SeasonId != 0) {
                        self.currentSeason(data.SeasonName);
                    }
                    else {
                        self.currentSeason(null);
                    }
                }
                else {
                    self.currentSeason(null);
                }
            });
    };

    self.fillSeasons();
};


