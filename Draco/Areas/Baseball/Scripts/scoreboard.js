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

    self.getTodayGames = function () {

        var today = moment(new Date()).format('YYYY-MM-DD');

        var url = window.config.rootUri + '/odata/ScheduleOData/?accountId=' + self.accountId;
        url += "&$filter=GameDate eq datetime'" + today + "'";
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
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    };

    self.getYesterdaysGames = function () {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        yesterday = moment(yesterday).format('YYYY-MM-DD');

        var url = window.config.rootUri + '/odata/ScheduleOData/?accountId=' + self.accountId;
        url += "&$filter=GameDate eq datetime'" + yesterday + "'";
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
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });
    };

    self.getGameSummaries = function () {

        var startDate = new Date();
        startDate.setDate(startDate.getDate() - 2);
        startDate = moment(startDate).format('YYYY-MM-DD');

        var endDate = new Date();
        endDate.setDate(endDate.getDate() - 5);
        endDate = moment(endDate).format('YYYY-MM-DD');

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
            },
            error: function (xhr, ajaxOptions, thrownError) {
                alert("Caught error: Status: " + xhr.status + ". Error: " + thrownError);
            }
        });

        // go back three days for game summaries
//        DateTime curDay = yesterday.AddDays(-1.0);
//        var prevGames = new System.Collections.Generic.List<ModelObjects.Game>[3];
//        for (int i = 0; i < 3; i++)
//        {
//            var games = new System.Collections.Generic.List<ModelObjects.Game>();

//            games.AddRange(DataAccess.Schedule.GetScoreboard(Model.AccountId, curDay));
//            prevGames[i] = games;

//            curDay = curDay.AddDays(-1.0);
//        }

//        // parse out ones without game summaries
//        foreach (var games in prevGames)
//        {
//            var gameSummaries = new System.Collections.Generic.List<ModelObjects.Game>();
//            foreach (ModelObjects.Game g in games)
//        {
//                if (DataAccess.GameStats.HasGameRecap(g.Id))
//        {
//                    gameSummaries.Add(g);
//        }
//    }

//    games.Clear();
//    games.AddRange(gameSummaries);
//}
//    }

//                            @{
//                                bool hasSummaries = false;
//                                foreach (var games in prevGames)
//                                {
//                                    if (games.Any())
//                                    {
//                                        hasSummaries = true;
//                                        break;
//                                    }
//                                }
//                            }

//                            @if (hasSummaries)
//                            {
//                                curDay = yesterday.AddDays(-1.0);

//                                foreach (var games in prevGames)
//                                {
//                                    if (games.Count > 0)
//                                    {

    };

    self.getTodayGames();
};



