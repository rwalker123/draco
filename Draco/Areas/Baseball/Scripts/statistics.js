function initStatisticsViewModel(accountId, isAdmin) {

    initKOHelpers();

    var statsElem = document.getElementById("statisticsView");
    if (statsElem) {
        var statsVM = new StatisticsViewModel(accountId, isAdmin);
        ko.applyBindings(statsVM, statsElem);
        $("th").tooltip({ container: 'body' });
    }
}

var StatisticsViewModel = function (accountId, isAdmin) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.pageSize = 50;

    self.isBatLoading = ko.observable(false);
    self.isPitchLoading = ko.observable(false);

    self.selectedSeasonId = ko.observable();
    self.selectedSeasonId.subscribe(function (data) {

        self.loadLeagues();
        self.populateTeamsList();
        self.populateStandings();
    });

    self.leagues = ko.observableArray();
    self.selectedLeagueId = ko.observable();
    self.selectedLeagueId.subscribe(function () {
        self.loadDivisions();
    })


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

    self.divisions = ko.observableArray();
    self.selectedDivisionId = ko.observable();
    self.selectedDivisionId.subscribe(function () {
        self.loadLeaders();
    });


    self.loadDivisions = function () {
    
        var url = window.config.rootUri;

        var currentDivId = self.selectedDivisionId();

        var selectedLeague = self.selectedLeagueId();
        if (selectedLeague === undefined || self.selectedSeasonId() == 0) {
            self.divisions.removeAll();

            // division id didn't change, so manually load leaders.
            if (currentDivId == self.selectedDivisionId())
                self.loadLeaders();
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

                // division id didn't change, so manually load leaders.
                if (currentDivId == self.selectedDivisionId())
                    self.loadLeaders();
            }
        });
    }

    self.leaders = new LeadersViewModel(accountId, isAdmin, 0, true);

    self.loadLeaders = function () {

        self.batStatsPageNumber(1);
        self.pitchStatsPageNumber(1);

        self.leaders.selectedDivisionId(self.selectedDivisionId() || 0);
        if (!self.selectedLeagueId()) {
            self.leaders.clearLeaders();
            self.leagueSortablePitchStats.removeAll();
            self.leagueSortableBatStats.removeAll();
            return;
        }

        self.leaders.allTimeLeaders(self.selectedSeasonId() == 0);

        if (self.leaders.selectedLeagueId() == self.selectedLeagueId())
            self.leaders.updateLeaders();
        else
            self.leaders.selectedLeagueId(self.selectedLeagueId());

        self.populateLeagueBatStats(self.batStatsPageNumber(), self.pageSize, self.batStatsSortField(), self.batStatsSortOrder());
        self.populateLeaguePitchStats(self.pitchStatsPageNumber(), self.pageSize, self.pitchStatsSortField(), self.pitchStatsSortOrder());
    }

    self.prevBatStatsAvailable = ko.observable(false);
    self.nextBatStatsAvailable = ko.observable(false);
    self.leagueSortableBatStats = ko.observableArray();
    self.batStatsPageNumber = ko.observable(1);
    self.batStatsSortField = ko.observable("AVG");
    self.batStatsSortOrder = ko.observable("descending");

    self.batSortBy = function (data, event) {
        var sortField = event.currentTarget.dataset.sortField || event.currentTarget.innerText;
        if (self.batStatsSortField() == sortField) {
            if (self.batStatsSortOrder() == "ascending")
                self.batStatsSortOrder("descending");
            else
                self.batStatsSortOrder("ascending");
        }
        else {
            self.batStatsSortField(sortField);
        }

        self.populateLeagueBatStats(self.batStatsPageNumber(), self.pageSize, self.batStatsSortField(), self.batStatsSortOrder());
    }

    self.gotoBatStatsPrev = function () {
        self.batStatsPageNumber(self.batStatsPageNumber() - 1);
        self.populateLeagueBatStats(self.batStatsPageNumber(), self.pageSize, self.batStatsSortField(), self.batStatsSortOrder());
    }

    self.gotoBatStatsNext = function () {
        self.batStatsPageNumber(self.batStatsPageNumber() + 1);
        self.populateLeagueBatStats(self.batStatsPageNumber(), self.pageSize, self.batStatsSortField(), self.batStatsSortOrder(), true);
    }

    self.populateLeagueBatStats = function (pageNo, pageSize, sortField, sortOrder, isNextAction) {

        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.selectedSeasonId() == 0)
            url += "/alltimebatstats/" + self.selectedLeagueId() + "/";
        else
            url += "/seasonbatstats/" + self.selectedLeagueId() + "/";

        url += '?sortField=' + sortField;
        url += '&sortOrder=' + sortOrder;
        url += '&pageSize=' + pageSize;
        url += '&pageNo=' + pageNo;
        if (self.selectedDivisionId())
            url += "&divisionId=" + self.selectedDivisionId();

        self.isBatLoading(true);

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerBatStats) {
                
                if (!isNextAction || (isNextAction && playerBatStats && playerBatStats.length)) {
                    self.prevBatStatsAvailable(pageNo > 1);
                    self.nextBatStatsAvailable(true);
                    self.leagueSortableBatStats(playerBatStats);
                }
                else {
                    self.batStatsPageNumber(self.batStatsPageNumber() - 1);
                    self.nextBatStatsAvailable(false);
                }

                self.isBatLoading(false);
            }
        });
    }

    self.prevPitchStatsAvailable = ko.observable(false);
    self.nextPitchStatsAvailable = ko.observable(false);
    self.leagueSortablePitchStats = ko.observableArray();
    self.pitchStatsPageNumber = ko.observable(1);
    self.pitchStatsSortField = ko.observable("ERA");
    self.pitchStatsSortOrder = ko.observable("ascending");

    self.pitchSortBy = function (data, event) {
        var sortField = event.currentTarget.dataset.sortField || event.currentTarget.innerText;
        if (self.pitchStatsSortField() == sortField) {
            if (self.pitchStatsSortOrder() == "ascending")
                self.pitchStatsSortOrder("descending");
            else
                self.pitchStatsSortOrder("ascending");
        }
        else {
            self.pitchStatsSortField(sortField);
        }

        self.populateLeaguePitchStats(self.pitchStatsPageNumber(), self.pageSize, self.pitchStatsSortField(), self.pitchStatsSortOrder());
    }


    self.gotoPitchStatsPrev = function () {
        self.pitchStatsPageNumber(self.pitchStatsPageNumber() - 1);
        self.populateLeaguePitchStats(self.pitchStatsPageNumber(), self.pageSize, self.pitchStatsSortField(), self.pitchStatsSortOrder());
    }

    self.gotoPitchStatsNext = function () {
        self.pitchStatsPageNumber(self.pitchStatsPageNumber() + 1);
        self.populateLeaguePitchStats(self.pitchStatsPageNumber(), self.pageSize, self.pitchStatsSortField(), self.pitchStatsSortOrder(), true);
    }

    self.populateLeaguePitchStats = function (pageNo, pageSize, sortField, sortOrder, isNextAction) {

        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId;

        if (self.selectedSeasonId() == 0)
            url += "/alltimepitchstats/" + self.selectedLeagueId() + "/";
        else
            url += "/seasonpitchstats/" + self.selectedLeagueId() + "/";

        url += '?sortField=' + sortField;
        url += '&sortOrder=' + sortOrder;
        url += '&pageSize=' + pageSize;
        url += '&pageNo=' + pageNo;
        if (self.selectedDivisionId())
            url += "&divisionId=" + self.selectedDivisionId();

        self.isPitchLoading(true);

        $.ajax({
            type: "GET",
            url: url,
            success: function (playerPitchStats) {

                if (!isNextAction || (isNextAction && playerPitchStats && playerPitchStats.length)) {
                    self.prevPitchStatsAvailable(pageNo > 1);
                    self.nextPitchStatsAvailable(true);
                    self.leagueSortablePitchStats(playerPitchStats);
                }
                else {
                    self.pitchStatsPageNumber(self.pitchStatsPageNumber() - 1);
                    self.nextPitchStatsAvailable(false);
                }

                self.isPitchLoading(false);
            }
        });
    }

    self.selectedTeamId = ko.observable();
    self.selectedTeamId.subscribe(function () {
        self.loadTeamBatStats();
        self.loadTeamPitchStats();
    });

    self.teamsList = ko.observableArray();
    self.teamSortableBatStats = ko.observableArray();
    self.teamSortablePitchStats = ko.observableArray();

    self.populateTeamsList = function () {
        var url = window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/LeagueTeams/' + self.selectedSeasonId();

        $.ajax({
            type: "GET",
            url: url,
            success: function (leagueTeams) {

                self.teamsList(leagueTeams);
            }
        });
    }

    self.loadTeamBatStats = function () {

        if (self.selectedTeamId() <= 0) {
            return;
        }

        self.teamSortableBatStats.removeAll();

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.selectedTeamId();

        if (self.selectedSeasonId() == 0)
            url += '/historicalbatstats';
        else
            url += '/gamebatstats';

        $.ajax({
            type: "GET",
            url: url,
            success: function (teamStats) {

                self.teamSortableBatStats(teamStats);
            }
        });

    }

    self.loadTeamPitchStats = function () {

        if (self.selectedTeamId() <= 0) {
            return;
        }

        self.teamSortablePitchStats.removeAll();

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + self.selectedTeamId();

        if (self.selectedSeasonId() == 0)
            url += '/historicalpitchstats';
        else
            url += '/gamepitchstats';

        $.ajax({
            type: "GET",
            url: url,
            success: function (teamStats) {

                self.teamSortablePitchStats(teamStats);
            }
        });
    }

    self.standingLeagues = ko.observableArray();

    self.populateStandings = function () {

        if (self.selectedSeasonId() == 0) {
            self.standingLeagues.removeAll();
            return;
        }

        var url = window.config.rootUri + '/api/StatisticsAPI/' + self.accountId + '/historicalstandings/' + self.selectedSeasonId();

        $.ajax({
            type: "GET",
            url: url,
            success: function (standingLeagues) {

                self.standingLeagues(standingLeagues);
            }
        });
    }

    self.foundPlayer = ko.observable();

    self.loadPlayer = function () {
        if (!self.foundPlayer() || !self.foundPlayer().Id) {
            return;
        }

        window.location = window.config.rootUri + '/baseball/player/contact/' + self.accountId + '/' + self.foundPlayer().Id;
    }

    self.getPlayers = function (query, cb) {

        $.ajax({
            url: window.config.rootUri + '/api/UserRolesAPI/' + self.accountId + '/SearchContacts',
            dataType: "json",
            data: {
                lastName: query,
                firstName: '',
                page: 1
            },
            success: function (data) {

                var results = $.map(data, function (item) {
                    var fullName = item.LastName + ", " + item.FirstName;
                    if (item.MiddleName)
                        fullName += " " + item.MiddleName;

                    return {
                        label: fullName,
                        Id: item.Id,
                        PhotoURL: item.PhotoURL,
                        FirstName: item.FirstName,
                        LastName: item.LastName
                    }
                });
                cb(results);
            },
        });
    }
}
