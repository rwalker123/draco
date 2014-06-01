function initLeadersViewModel(accountId, isAdmin, teamId) {

    var leadersElem = document.getElementById("leadersView");
    if (leadersElem) {
        var leadersVM = new LeadersViewModel(accountId, isAdmin, teamId);
        ko.applyBindings(leadersVM, leadersElem);
    }
}

var LeadersViewModel = function (accountId, isAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    self.x = ko.observableArray();

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
        self.editMode(false);
        //self.updateLeaders();
    }

    self.cancelChanges = function () {
        self.editMode(false);
        self.initBatSelectedCategories();
        self.initPitchSelectedCategories();
    }

    self.fillBatCategories = function () {
        self.batCategories.push({ Id: "AVG&calcMinAB=1", Name: "AVG", NumDecimals: 3, TrimLeadingZero: true, Leaders: ko.observableArray() });
        self.batCategories.push({ Id: "RBI", Name: "RBI", NumDecimals: 0, TrimLeadingZero: false, Leaders: ko.observableArray() });
        self.batCategories.push({ Id: "HR", Name: "HR", NumDecimals: 0, TrimLeadingZero: false, Leaders: ko.observableArray() });

        self.initBatSelectedCategories();

        self.getBattingLeaders();
    }

    self.initBatSelectedCategories = function () {
        if (self.isAdmin && !self.teamId) {
            self.selectedBatCategories.removeAll();

            $.each(self.batCategories(), function (index, cat) {
                self.selectedBatCategories.push(cat.Id);
            });
        }
    }

    self.initPitchSelectedCategories = function () {
        if (self.isAdmin && !self.teamId) {
            self.selectedPitchCategories.removeAll();

            $.each(self.pitchCategories(), function (index, cat) {
                self.selectedPitchCategories.push(cat.Id);
            });
        }
    }

    self.getPitchCategories = function () {
        self.pitchCategories.push({ Id: "ERA&calcMinIP=1", Name: "ERA", NumDecimals: 2, TrimLeadingZero: false, Leaders: ko.observableArray() });
        self.pitchCategories.push({ Id: "W", Name: "W", NumDecimals: 0, TrimLeadingZero: false, Leaders: ko.observableArray() });
        self.pitchCategories.push({ Id: "SO", Name: "SO", NumDecimals: 0, TrimLeadingZero: false, Leaders: ko.observableArray() });

        self.initPitchSelectedCategories();

        self.getPitchingLeaders();
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

            url = url + '/?category=' + cat.Id;

            self.getLeaders(url, cat.Leaders, cat.NumDecimals, cat.TrimLeadingZero);
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

            url = url + '/?category=' + cat.Id;

            self.getLeaders(url, cat.Leaders, cat.NumDecimals, cat.TrimLeadingZero);
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
    self.getPitchCategories();

    if (self.isAdmin && !self.teamId) {
        self.getBatAvailableCategories();
        self.getPitchAvailableCategories();
    }
};
