function initScoreboardViewModel(accountId, isAdmin, teamId) {

    var scoreboardElem = document.getElementById("scoreboardView");
    if (scoreboardElem) {
        var scoreboardVM = new ScoreboardViewModel(accountId, isAdmin, teamId);
        ko.applyBindings(scoreboardVM, scoreboardElem);
    }
}

var GameResultViewModel = function (data) {
    var self = this;

    ko.mapping.fromJS(data, {}, self);

    self.GameDate.TimeText = ko.computed(function() {
        return moment(self.GameDate()).format('h:mma');
    });

    self.GameStatus.Text = ko.computed(function() {
        if (self.GameStatus() == 1)
            return "F";
        else if (self.GameStatus() == 2)
            return "R";
        else if (self.GameStatus() == 3)
            return "P";
        else if (self.GameStatus() == 4)
            return "FG";
        else if (self.GameStatus() == 5)
            return "DNR";
    });

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
    }

    self.toJS = function () {
        var js = ko.mapping.toJS(self);
        return js;
    }

};

var GamesForDayViewModel = function (title) {
    var self = this;

    self.title = ko.observable(title);
    self.games = ko.observableArray();
}

var ScoreboardViewModel = function (accountId, isAdmin, teamId) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;
    self.teamId = teamId;

    self.scheduledGames = ko.observableArray();

    self.editingGameResults = ko.validatedObservable(new GameResultsViewModel(self.accountId, {
        Id: 0,
        HomeTeamName: '',
        AwayTeamName: '',
        GameDate: '',
        HomeTeamId: 0,
        AwayTeamId: 0,
        GameType: 0,
        GameStatus: 0,
        FieldId: 0,
        FieldName: '',
        HomeScore: null,
        AwayScore: null,
        AwayPlayersPresent: [],
        HomePlayersPresent: []
    }));

    self.editingGameResults().Id.showResultsForm(true);

    self.getTodayGames = function () {

        var today = moment(new Date()).format('YYYY-MM-DD');
        var tommorow = moment(new Date()).add('days', 1).format('YYYY-MM-DD');

        var url = window.config.rootUri + '/odata/ScheduleOData/?accountId=' + self.accountId;
        url += "&$filter=GameDate ge datetime'" + today + "' and GameDate lt datetime'" + tommorow + "'";
        if (self.teamId) {
            url += " and (HomeTeamId eq " + self.teamId + " or AwayTeamId eq " + self.teamId + ")";
        }
        url += '&$inlinecount=allpages';
        url += '&$orderby=GameDate asc';

        $.ajax({
            type: "GET",
            url: url,
            success: function (results) {
                if (results.value.length) {
                    var vm = new GamesForDayViewModel("today");

                    $.map(results.value, function (game) {
                        vm.games.push(new GameResultViewModel(game));
                    });

                    self.scheduledGames.push(vm);
                }

                self.getYesterdaysGames();
            }
        });
    };

    self.getYesterdaysGames = function () {

        var today = moment(new Date()).format('YYYY-MM-DD');
        var yesterday = moment(new Date()).add('d', -1).format('YYYY-MM-DD');

        var url = window.config.rootUri + '/odata/ScheduleOData/?accountId=' + self.accountId;
        url += "&$filter=GameDate ge datetime'" + yesterday + "' and GameDate lt datetime'" + today + "'";
        if (self.teamId) {
            url += " and (HomeTeamId eq " + self.teamId + " or AwayTeamId eq " + self.teamId + ")";
        }
        url += '&$inlinecount=allpages';
        url += '&$orderby=GameDate asc';

        $.ajax({
            type: "GET",
            url: url,
            success: function (results) {
                if (results.value.length) {
                    var vm = new GamesForDayViewModel("yesterday");

                    $.map(results.value, function (game) {
                        vm.games.push(new GameResultViewModel(game));
                    });

                    self.scheduledGames.push(vm);
                }

                self.getGameSummaries();
            }
        });
    };

    self.getGameSummaries = function () {

        var endDate = moment(new Date()).add('d', -1).format('YYYY-MM-DD');
        var startDate = moment(new Date()).add('d', -8).format('YYYY-MM-DD');

        var url = window.config.rootUri + '/odata/ScheduleOData/?accountId=' + self.accountId;
        url += "&$filter=GameDate ge datetime'" + startDate + "' and GameDate le datetime'" + endDate + "'";
        if (self.teamId) {
            url += " and (HomeTeamId eq " + self.teamId + " or AwayTeamId eq " + self.teamId + ")";
        }
        url += " and HasGameRecap eq true"
        url += '&$inlinecount=allpages';
        url += '&$orderby=GameDate asc';

        $.ajax({
            type: "GET",
            url: url,
            success: function (results) {

                if (results.value.length) {
                    var vm = new GamesForDayViewModel("game recaps");

                    $.map(results.value, function (game) {
                        vm.games.push(new GameResultViewModel(game));
                    });

                    self.scheduledGames.push(vm);
                }
            }
        });
    };

    self.homeGameSummary = ko.observable();
    self.awayGameSummary = ko.observable();
    self.homeTeamName = ko.observable();
    self.awayTeamName = ko.observable();

    self.popupGameRecap = function (item) {
        self.getGameSummary(item.AwayTeamId(), item.Id(), self.awayGameSummary);
        self.getGameSummary(item.HomeTeamId(), item.Id(), self.homeGameSummary);

        self.homeTeamName(item.HomeTeamName());
        self.awayTeamName(item.AwayTeamName());

        $("#gameRecapModal").modal("show");
    };

    self.popupGameResults = function (game) {

        var data = game.toJS();
        self.editingGameResults().update(data);

        self.getRoster(self.editingGameResults().HomeTeamId(), function (players) {
            self.editingGameResults().HomePlayersPresent.removeAll();
            self.editingGameResults().HomeTeamId.roster(players);
            data.HomePlayersPresent.forEach(function (value, index, arr) {
                self.editingGameResults().HomePlayersPresent.push(value);
            });
        });
        self.getRoster(self.editingGameResults().AwayTeamId(), function (players) {
            self.editingGameResults().AwayPlayersPresent.removeAll();
            self.editingGameResults().AwayTeamId.roster(players);
            data.AwayPlayersPresent.forEach(function (value, index, arr) {
                self.editingGameResults().AwayPlayersPresent.push(value);
            });
        });

        $("#gameResultsModal").modal("show");
    };

    // cache team rosters
    self.rostersCache = {};

    self.getRoster = function (teamId, callback) {
        if (teamId in self.rostersCache)
            callback(self.rostersCache[teamId]);
        else {

            $.ajax({
                type: "GET",
                url: window.config.rootUri + '/api/RosterAPI/' + self.accountId + '/team/' + teamId + '/players',
                success: function (players) {
                    self.rostersCache[teamId] = $.map(players, function (player) {
                        return { Name: player.Contact.FullName, Id: player.Id };
                    });

                    callback(self.rostersCache[teamId]);
                }
            });
        }
    }


    self.updateGameResult = function (editGame) {

        self.editingGameResults().updateGameResult(function (updatedGame) {
            self.cancelUpdateGameResult();

            $.map(self.scheduledGames(), function (item) {
                return $.map(item.games(), function (game) {
                    if (game.Id() == updatedGame.Id) {
                        game.update(updatedGame);
                        return false;
                    }
                });
            });
        });
    }

    self.cancelUpdateGameResult = function (game) {
        $("#gameResultsModal").modal("hide");
    }




    self.getGameSummary = function (teamId, gameId, observableSummary) {

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + teamId + '/gamesummary/' + gameId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (gameSummary) {
                if (gameSummary) {
                    observableSummary(gameSummary);
                }
                else {
                    observableSummary("No Game Summary");
                }
            }
        });

    };

    self.getTodayGames();
};



