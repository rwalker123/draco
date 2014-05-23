function initStatisticsViewModel(accountId, isAdmin) {

    initKOHelpers();

    var statsElem = document.getElementById("statisticsView");
    if (statsElem) {
        var statsVM = new StatisticsViewModel(accountId, isAdmin);
        ko.applyBindings(statsVM, statsElem);
    }
}

var StatisticsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.selectedSeasonId = ko.observable();
    self.selectedSeasonId.subscribe(function () {
        self.loadLeagues();
    });

    self.selectedLeagueId = ko.observable();
    self.selectedLeagueId.subscribe(function () {
        self.loadDivisions();
    })
    self.leagues = ko.observableArray();

    self.loadLeagues = function () {
        var selectedSeason = self.selectedSeasonId();

        var url = window.config.rootUri;

        var url;
        if (selectedSeason == 0)
            url = url + '/api/StatisticsAPI/' + self.accountId + '/historicalleagues';
        else
            url = url + '/api/LeaguesAPI/' + self.accountId + "/Leagues/" + selectedSeason; 

        $.ajax({
            type: "GET",
            url: url,
            success: function (l) {
                self.leagues(l);
            }
        });

    }

    self.selectedDivisionId = ko.observable();
    self.selectedDivisionId.subscribe(function () {
        self.loadLeaders();
    });

    self.divisions = ko.observableArray();

    self.loadDivisions = function () {
    
        var url = window.config.rootUri;

        var selectedLeague = self.selectedLeagueId();
        if (selectedLeague === undefined || self.selectedSeasonId() == 0) {
            self.divisions.removeAll();
            return;
        }

        var url = url + '/api/LeaguesAPI/' + self.accountId + "/Divisions/" + selectedLeague;

        $.ajax({
            type: "GET",
            url: url,
            success: function (d) {
                d.splice(0, 0, {
                    Id: 0,
                    Name: "All Divisions"
                });
                self.divisions(d);
            }
        });
    }

    self.leaders = new LeadersViewModel(accountId, isAdmin, 0);

    self.loadLeaders = function () {

        self.leaders.selectedDivisionId(self.selectedDivisionId() || 0);
        if (!self.selectedLeagueId()) {
            self.leaders.clearLeaders();
            return;
        }

        self.leaders.allTimeLeaders(self.selectedSeasonId() == 0);

        if (self.leaders.selectedLeagueId() == self.selectedLeagueId())
            self.leaders.updateLeaders();
        else
            self.leaders.selectedLeagueId(self.selectedLeagueId());
    }

}
