function initLeadersViewModel(accountId, isAdmin, teamId, useDefaultCats) {

    var leadersElem = document.getElementById("leadersView");
    if (leadersElem) {
        var leadersVM = new LeadersViewModel(accountId, isAdmin, teamId, useDefaultCats);
        ko.applyBindings(leadersVM, leadersElem);
    }
}

var LeaderCategoryViewModel = function(data) {
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

    self.Leaders = ko.observableArray();

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }
}

var LeadersViewModel = function (accountId, isAdmin, teamId, useDefaultCats) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    // if no categories configured, set to true to use a default set.
    self.useDefaultCats = useDefaultCats;

    // categories to display. Leaders field has leaders.
    self.batCategories = ko.observableArray();
    self.pitchCategories = ko.observableArray();

    self.selectedBatCategories = ko.observableArray();
    self.selectedPitchCategories = ko.observableArray();

    self.selectedLeagueId = ko.observable();
    self.selectedLeagueId.subscribe(function () {
        self.updateLeaders();
    });

    self.selectedDivisionId = ko.observable();
    self.selectedDivisionId.subscribe(function () {
    });

    self.allTimeLeaders = ko.observable(false);

    self.updateLeaders = function () {
        self.getBattingLeaders();
        self.getPitchingLeaders();
    }

    self.editMode = ko.observable();
    self.toggleEditMode = function () {
        if (self.editMode())
            self.editMode(false);
        else
            self.editMode(true);
    }

    self.saveChanges = function () {
        if (self.selectedBatCategories().length > 3 ||
            self.selectedPitchCategories().length > 3)
            return;

        self.editMode(false);

        var batData = {
            cats: []
        };

        self.batCategories.removeAll();
        $.each(self.selectedBatCategories(), function (index, cat) {
            var foundCat = ko.utils.arrayFirst(self.availableBatCategories(), function (availableCat) {
                return (cat == availableCat.Id);
            });

            if (foundCat) {
                var batCat = new LeaderCategoryViewModel(foundCat);
                self.batCategories.push(batCat);
                batData.cats.push(foundCat);
            }
        });

        var pitchData = {
            cats: []
        };

        self.pitchCategories.removeAll();
        $.each(self.selectedPitchCategories(), function (index, cat) {
            var foundCat = ko.utils.arrayFirst(self.availablePitchCategories(), function (availableCat) {
                return (cat == availableCat.Id);
            });

            if (foundCat) {
                var pitchCat = new LeaderCategoryViewModel(foundCat);
                self.pitchCategories.push(pitchCat);
                pitchData.cats.push(foundCat);
            }
        });

        self.updateLeaders();

        // update the categories, since we already updated the UI above, if this fails, the
        // next time the screen is refreshed, the old settings will take over.
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/setbatcategories';

        $.ajax({
            type: "POST",
            url: url,
            data: batData,
            success: function () {
            }
        });

        url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/setpitchcategories';

        $.ajax({
            type: "POST",
            url: url,
            data: pitchData,
            success: function () {
            }
        });

    }

    self.cancelChanges = function () {
        self.editMode(false);
        self.initBatSelectedCategories();
        self.initPitchSelectedCategories();
    }

    self.fillBatCategories = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/batselectedcategories';

        $.ajax({
            type: "GET",
            url: url,
            success: function (leaderCats) {
                self.batCategories.removeAll();
                $.each(leaderCats, function (index, cat) {
                    self.batCategories.push(new LeaderCategoryViewModel(cat));
                });

                if (self.batCategories().length == 0 && self.useDefaultCats) {
                    self.batCategories.push(new LeaderCategoryViewModel({ Id: "AVG&calcMinAB=1", Name: "AVG", NumDecimals: 3, TrimLeadingZero: true }));
                    self.batCategories.push(new LeaderCategoryViewModel({ Id: "RBI", Name: "RBI", NumDecimals: 0, TrimLeadingZero: false }));
                    self.batCategories.push(new LeaderCategoryViewModel({ Id: "HR", Name: "HR", NumDecimals: 0, TrimLeadingZero: false }));
                }

                self.initBatSelectedCategories();
                self.getBattingLeaders();

            }
        });

    }

    self.initBatSelectedCategories = function () {
        if (self.isAdmin && !self.teamId) {
            self.selectedBatCategories.removeAll();

            $.each(self.batCategories(), function (index, cat) {
                self.selectedBatCategories.push(cat.Id());
            });
        }
    }

    self.initPitchSelectedCategories = function () {
        if (self.isAdmin && !self.teamId) {
            self.selectedPitchCategories.removeAll();

            $.each(self.pitchCategories(), function (index, cat) {
                self.selectedPitchCategories.push(cat.Id());
            });
        }
    }

    self.fillPitchCategories = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/pitchselectedcategories';

        $.ajax({
            type: "GET",
            url: url,
            success: function (leaderCats) {
                self.pitchCategories.removeAll();
                $.each(leaderCats, function (index, cat) {
                    self.pitchCategories.push(new LeaderCategoryViewModel(cat));
                });

                if (self.pitchCategories().length == 0 && self.useDefaultCats) {
                    self.pitchCategories.push(new LeaderCategoryViewModel({ Id: "ERA&calcMinIP=1", Name: "ERA", NumDecimals: 2, TrimLeadingZero: false }));
                    self.pitchCategories.push(new LeaderCategoryViewModel({ Id: "W", Name: "W", NumDecimals: 0, TrimLeadingZero: false }));
                    self.pitchCategories.push(new LeaderCategoryViewModel({ Id: "SO", Name: "SO", NumDecimals: 0, TrimLeadingZero: false })); 
                }

                self.initPitchSelectedCategories();
                self.getPitchingLeaders();
            }
        });

    }

    self.getLeaders = function (url, obsArray, fixedDecimal, trimLeadingZero) {

        if (self.selectedDivisionId()) {
            url = url + "&divisionId=" + self.selectedDivisionId();
        }

        if (self.allTimeLeaders()) {
            url = url + "&allTimeLeaders=" + self.allTimeLeaders();
        }

        $.ajax({
            type: "GET",
            url: url,
            success: function (leaders) {
                var mapLeaders = $.map(leaders, function (leader) {
                    if (fixedDecimal !== undefined) {
                        leader.FieldTotal = leader.FieldTotal.toFixed(fixedDecimal);
                    }
                    if (trimLeadingZero) {
                        leader.FieldTotal = leader.FieldTotal.replace(/^0+/, '');
                    }
                    return leader;
                });

                // if there is a leader tie, don't show it, unless it is the only field.
                if (mapLeaders.length > 1) {
                    if (mapLeaders[0].FieldName == "TIE")
                        mapLeaders.splice(0, 1);
                }
                obsArray(mapLeaders);
                obsArray.valueHasMutated();

            }
        });
    }

    self.getBattingLeaders = function () {

        $.each(self.batCategories(), function (index, cat) {
            cat.Leaders.removeAll();

            var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

            if (self.teamId)
                url = url + '/Team/' + self.teamId + '/teambatleaders';
            else
                url = url + '/League/' + self.selectedLeagueId() + '/batleaders';

            url = url + '/?category=' + cat.Id();

            self.getLeaders(url, cat.Leaders, cat.NumDecimals(), cat.TrimLeadingZero());
        });
    };

    self.getPitchingLeaders = function () {
        $.each(self.pitchCategories(), function (index, cat) {
            cat.Leaders.removeAll();

            var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

            if (self.teamId)
                url = url + '/Team/' + self.teamId + '/teampitchleaders';
            else
                url = url + '/League/' + self.selectedLeagueId() + '/pitchleaders';

            url = url + '/?category=' + cat.Id();

            self.getLeaders(url, cat.Leaders, cat.NumDecimals(), cat.TrimLeadingZero());
        });

    }

    self.availableBatCategories = ko.observableArray();

    self.getBatAvailableCategories = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/batcategories';

        $.ajax({
            type: "GET",
            url: url,
            success: function (cats) {
                self.availableBatCategories(cats);
            }
        });
    }

    self.availablePitchCategories = ko.observableArray();

    self.getPitchAvailableCategories = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/pitchcategories';

        $.ajax({
            type: "GET",
            url: url,
            success: function (cats) {
                self.availablePitchCategories(cats);
            }
        });
    }

    self.fillBatCategories();
    self.fillPitchCategories();

    if (self.isAdmin && !self.teamId) {
        self.getBatAvailableCategories();
        self.getPitchAvailableCategories();
    }
};
