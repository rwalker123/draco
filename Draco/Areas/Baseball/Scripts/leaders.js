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

    self.selectedLeagueId = ko.observable();
    self.selectedLeagueId.subscribe(function () {
        self.updateLeaders();
    });

    self.updateLeaders = function () {
        self.getBattingLeaders1();
        self.getBattingLeaders2();
        self.getBattingLeaders3();

        self.getPitchingLeaders1();
        self.getPitchingLeaders2();
        self.getPitchingLeaders3();
    }

    self.batLeagueLeadersCat1 = ko.observableArray();
    self.batLeagueLeadersCat2 = ko.observableArray();
    self.batLeagueLeadersCat3 = ko.observableArray();

    self.pitchLeagueLeadersCat1 = ko.observableArray();
    self.pitchLeagueLeadersCat2 = ko.observableArray();
    self.pitchLeagueLeadersCat3 = ko.observableArray();

    self.getLeaders = function (url, obsArray, fixedDecimal, trimLeadingZero) {

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
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    }

    self.getBattingLeaders1 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teambatleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/batleaders';

        url = url + '/?category=AVG&calcMinAB=1';

        self.getLeaders(url, self.batLeagueLeadersCat1, 3, true);
    };

    self.getBattingLeaders2 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teambatleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/batleaders';

        url = url + '/?category=RBI';

        self.getLeaders(url, self.batLeagueLeadersCat2);
    };

    self.getBattingLeaders3 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teambatleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/batleaders';

        url = url + '/?category=HR';

        self.getLeaders(url, self.batLeagueLeadersCat3);
    };

    self.getPitchingLeaders1 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teampitchleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/pitchleaders';

        url = url + '/?category=ERA&calcMinIP=1';

        self.getLeaders(url, self.pitchLeagueLeadersCat1, 2, false);
    };

    self.getPitchingLeaders2 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teampitchleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/pitchleaders';

        url = url + '/?category=W';

        self.getLeaders(url, self.pitchLeagueLeadersCat2);
    };

    self.getPitchingLeaders3 = function () {
        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.teamId)
            url = url + '/Team/' + self.teamId + '/teampitchleaders';
        else
            url = url + '/League/' + self.selectedLeagueId() + '/pitchleaders';

        url = url + '/?category=SO';

        self.getLeaders(url, self.pitchLeagueLeadersCat3);
    };

    if (self.teamId) {
        self.updateLeaders();
    }

};
