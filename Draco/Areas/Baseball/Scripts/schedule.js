function initScheduleViewModel(accountId, isAdmin, allUmpires) {
    initKOHelpers();

    var scheduleElem = document.getElementById("schedule");
    if (scheduleElem) {
        ko.validation.rules['mustNotEqual'] = {
            validator: function (val, otherVal) {
                return val !== otherVal;
            },
            message: 'The home team and away team must be different'
        };
        ko.validation.registerExtenders();

        var scheduleVM = new ScheduleViewModel(accountId, isAdmin, allUmpires);
        ko.applyBindings(scheduleVM, scheduleElem);
    }
}

var weekday = new Array(7);
weekday[0] = "Sun";
weekday[1] = "Mon";
weekday[2] = "Tue";
weekday[3] = "Wed";
weekday[4] = "Thu";
weekday[5] = "Fri";
weekday[6] = "Sat";

var GameDayViewModel = function (theDate) {
    var self = this;
    
    self.date = ko.observable(new Date(theDate));
    self.games = ko.observableArray();
    self.monthDayNumber = ko.computed(function () {
        return self.date().getDate();
    });
    self.monthName = ko.computed(function () {
        return moment(self.date()).format("MMM");
    });
    self.dayOfWeek = ko.computed(function () {
        return weekday[self.date().getDay()];
    });
    self.date.text = ko.computed(function () {
        return moment(self.date()).format("MMMM D, YYYY");
    });
}

var GameViewModel = function (data, accountId) {
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

    self.GameDate.extend({
        required: true,
        date: true
    })
    self.GameDate.TimeText = ko.observable(moment(self.GameDate() || new Date()).format("h:mm a"));
    self.GameDate.DateText = ko.observable(moment(self.GameDate() || new Date()).format("MM/DD/YYYY"));

    self.HomeTeamId.extend({ required: true });
    self.HomeTeamId.href = ko.computed(function () {
        return window.config.rootUri + '/baseball/team/index/' + self.accountId + '/' + self.HomeTeamId();
    });

    self.AwayTeamId.extend({ required: true }).extend({ mustNotEqual: self.HomeTeamId });
    self.AwayTeamId.href = ko.computed(function () {
        return window.config.rootUri + '/baseball/team/index/' + self.accountId + '/' + self.AwayTeamId();
    });

    self.FieldId.href = ko.computed(function () {
        return window.config.rootUri + '/baseball/fields/index/' + self.accountId + '/' + self.FieldId();
    });

    self.GameType.extend({ required: true });

    self.GameStatus.isFinal = ko.computed(function () {
        return self.GameStatus() != 0;
    });

    self.GameStatus.isFinalScore = ko.computed(function () {
        return self.GameStatus() == 1 || self.GameStatus() == 4 ||
            self.GameStatus() == 3;
    })

    self.GameStatus.Text = ko.computed(function () {
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
        else
            return "I";
    });

    self.Umpires = ko.observableArray();
    self.updateUmpires = function () {
        if (self.Umpire1()) {
            self.Umpires.push(self.Umpire1());
        }
        if (self.Umpire2()) {
            self.Umpires.push(self.Umpire2());
        }
        if (self.Umpire3()) {
            self.Umpires.push(self.Umpire3());
        }
        if (self.Umpire4()) {
            self.Umpires.push(self.Umpire4());
        }
    }

    self.updateUmpires();

    self.update = function (data) {
        ko.mapping.fromJS(data, self);
        self.Umpires.removeAll();
        self.updateUmpires();
        self.GameDate.TimeText(moment(self.GameDate()).format("h:mm a"));
        self.GameDate.DateText(moment(self.GameDate()).format("MM/DD/YYYY"));
    }

    self.toJS = function () {
        var gameTime = new Date("1/1/1980 " + self.GameDate.TimeText());
        var gameDate = new Date(self.GameDate.DateText());
        gameDate.setHours(gameTime.getHours());
        gameDate.setMinutes(gameTime.getMinutes());

        var js = ko.mapping.toJS(self);

        js.GameDate = moment(gameDate).format("MM/DD/YYYY h:mm a");
        js.Umpire1 = self.Umpires()[0] || 0;
        js.Umpire2 = self.Umpires()[1] || 0;
        js.Umpire3 = self.Umpires()[2] || 0;
        js.Umpire4 = self.Umpires()[3] || 0;

        return js;
    }
}

var ScheduleViewModel = function (accountId, isAdmin, allUmps) {
    var self = this;

    self.accountId = accountId;
    self.isAdmin = isAdmin;

    self.viewMode = ko.observable(false);
    self.loadingSchedule = ko.observable(true);
    self.addGameMode = ko.observable(false);
    self.leagueTeams = ko.observableArray([]);
    self.selectedTeam = ko.observable();
    self.selectedTeam.subscribe(function () {
        if (self.selectedTeam) {
            var foundItem = ko.utils.arrayFirst(self.leagueTeams(), function (item) {
                return item.Id == self.selectedTeam();
            });
            if (foundItem)
                self.selectedTeamName(foundItem.Name);
            else
                self.selectedTeamName('');
        }
        else {
            self.selectedTeamName('');
        }
        if (self.viewMode() && !self.loadingSchedule()) {
            self.setupMonthData(self.currentDate());
        }
    });

    self.selectedLeagueName = ko.observable();
    self.selectedTeamName = ko.observable();

    self.selectedLeague = ko.observable();
    
    self.selectedLeague.subscribe(function () {
        $.cookie('sched_last_selected_league', self.selectedLeague(), { expires: 180 });
        self.selectedLeagueName(self.getSelectedText('leagueSelect'));
        self.loadingSchedule(true);
        self.populateTeams();
        self.selectedTeam(null);
        self.setupMonthData(self.currentDate());
    });

    self.getSelectedText = function(elementId) {
        var elt = document.getElementById(elementId);

        if (elt.selectedIndex == -1)
            return null;

        return elt.options[elt.selectedIndex].text;
    }

    self.allUmpires = ko.observableArray(allUmps);

    self.currentDate = ko.observable(new Date());

    self.currentMonth = ko.computed(function () {
        return moment(self.currentDate()).format("MMMM");
    });

    self.gameMonth = ko.observableArray();

    // template for new game form.
    self.newGame = new GameViewModel({
        HomeTeamName: '',
        AwayTeamName: '',
        GameDate: '',
        HomeTeamId: null,
        AwayTeamId: null,
        GameType: 0,
        GameStatus: 0,
        FieldId: 0,
        FieldName: '',
        Umpire1: 0,
        Umpire2: 0,
        Umpire3: 0,
        Umpire4: 0,
        HasGameRecap: false
    }, self.accountId);

    // data for game currently being edit.
    self.editingGame = ko.validatedObservable(new GameViewModel({
        HomeTeamName: '',
        AwayTeamName: '',
        GameDate: '',
        HomeTeamId: 0,
        AwayTeamId: 0,
        GameType: 0,
        GameStatus: 0,
        FieldId: 0,
        FieldName: '',
        Umpire1: 0,
        Umpire2: 0,
        Umpire3: 0,
        Umpire4: 0,
        HasGameRecap: false
    }, self.accountId));

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

    self.isEditMode = ko.observable(false);
    self.gameEditorTitle = ko.computed(function () {
        if (self.isEditMode())
            return "Edit Game";
        else
            return "Create Game";
    });

    self.leagueTeamSelectDisabled = ko.computed(function () {
        if (!self.loadingSchedule() && self.viewMode()) {
            return undefined;
        }

        return 'disabled';
    });

    // cache the teams we have retrieved.
    self.teamsCache = {};

    // cache team rosters
    self.rostersCache = {};

    self.goPreviousMonth = function () {
        var currentMonth = self.currentDate().getMonth();

        if (currentMonth == 0) {
            currentMonth = 11;
        } 
        else {
            currentMonth--;
        }

        var date = new Date(self.currentDate());
        date.setMonth(currentMonth);

        self.setupMonthData(date);
    }

    self.goNextMonth = function () {
        var currentMonth = self.currentDate().getMonth();

        if (currentMonth == 11) {
            currentMonth = 0;
        }
        else {
            currentMonth++;
        }

        var date = new Date(self.currentDate());
        date.setMonth(currentMonth);

        self.setupMonthData(date);
    }

    self.enterAddGameMode = function (viewModel) {
        self.viewMode(false);

        self.newGame.GameDate(new Date(viewModel.date()));
        self.newGame.GameDate.DateText(self.newGame.GameDate());

        var data = self.newGame.toJS();
        self.editingGame().update(data);

        self.isEditMode(false);
        self.addGameMode(true);
    }

    self.enterAddGameModeFromListView = function () {
        self.viewMode(false);

        var gameDate = new Date();

        self.newGame.GameDate(gameDate);
        self.newGame.GameDate.DateText(self.newGame.GameDate());

        var data = self.newGame.toJS();
        self.editingGame().update(data);

        self.isEditMode(false);
        self.addGameMode(true);
    }

    self.addGame = function (editGame) {
        if (!self.editingGame.isValid())
            return;

        if (self.selectedLeague() == 0)
            return;

        var newData = self.editingGame().toJS();

        $.ajax({
            type: (self.isEditMode()) ? "PUT" : "POST",
            url: window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.selectedLeague() + '/game',
            data: newData,
            success: function (game) {
                self.cancelAddGame();
                if (self.isEditMode()) {
                    var wasFound = false;
                    // find item in calendar so we can update it.
                    $.each(self.gameMonth(), function (index, gameWeek) {
                        $.each(gameWeek(), function (index, gameDay) {
                            var foundItems = $.grep(gameDay.games(), function (e) {
                                return e.Id() == editGame.Id();
                            });

                            if (foundItems.length > 0) {
                                var foundItem = foundItems[0];
                                var newDate = new Date(game.GameDate);
                                var oldDate = new Date(foundItem.GameDate());
                                if (newDate.getMonth() != oldDate.getMonth() ||
                                    newDate.getDay() != oldDate.getDay() ||
                                    newDate.getYear() != oldDate.getYear()) {
                                    // need to remove from here and add to calendar.
                                    gameDay.games.remove(foundItem);
                                    self.addGameToCalendar(game);
                                }
                                else {
                                    foundItem.update(game);
                                    if (newDate != oldDate) {
                                        gameDay.games.sort(self.sortGamesByTime);
                                    }
                                }
                                wasFound = true;
                                return false;
                            }
                        });

                        return !wasFound;
                    });

                }
                else {
                    self.addGameToCalendar(game);
                }
            }
        });

    }

    self.cancelAddGame = function () {
        self.addGameMode(false);
        self.viewMode(true);
    }

    self.editGame = function (game) {

        var data = game.toJS();
        self.editingGame().update(data);
        self.viewMode(false);
        self.addGameMode(true);
        self.isEditMode(true);
        $("#newGameAwayTeam").selectpicker("refresh");
        $("#newGameHomeTeam").selectpicker("refresh");
    }

    self.deleteGame = function (game) {
        $("#deleteModal").modal("show");

        $("#confirmDeleteBtn").one("click", function () {
            self.performDeleteGame(game);
        });
    }

    self.performDeleteGame = function (game) {
        $.ajax({
            type: "DELETE",
            url: window.config.rootUri + '/api/ScheduleAPI/' + self.accountId + '/league/' + self.selectedLeague() + '/game/' + game.Id(),
            success: function () {
                $.each(self.gameMonth(), function (index, gameWeek) {
                    $.each(gameWeek(), function (index, gameDay) {
                        gameDay.games.remove(game);
                    });
                });
            }
        });
    }

    self.enterGameResults = function (game) {
        var data = game.toJS();
        self.editingGameResults().update(data);
        if (self.editingGameResults.isValid && !self.editingGameResults.isValid())
            return;

        self.viewMode(false);

        self.getRoster(self.editingGameResults().HomeTeamId(), function (players) {
            self.editingGameResults().HomeTeamId.roster(players);
        });
        self.getRoster(self.editingGameResults().AwayTeamId(), function (players) {
            self.editingGameResults().AwayTeamId.roster(players);
        });

        self.editingGameResults().Id.showResultsForm(true);
        $("#newGameStatus").selectpicker("refresh");
    }

    self.updateGameResult = function (editGame) {

        self.editingGameResults().updateGameResult(function (game) {
            self.cancelUpdateGameResult();

            var wasFound = false;
            // find item in calendar so we can update it.
            $.each(self.gameMonth(), function (index, gameWeek) {
                $.each(gameWeek(), function (index, gameDay) {
                    var foundItems = $.grep(gameDay.games(), function (e) {
                        return e.Id() == editGame.Id();
                    });

                    if (foundItems.length > 0) {
                        var foundItem = foundItems[0];
                        foundItem.update(game);
                        wasFound = true;
                        return false;
                    }
                });

                return !wasFound;
            });

        });
    }

    self.cancelUpdateGameResult = function (game) {
        self.editingGameResults().Id.showResultsForm(false);

        self.viewMode(true);
    }

    self.homeGameSummary = ko.observable('');
    self.awayGameSummary = ko.observable('');
    self.homeTeamName = ko.observable();
    self.awayTeamName = ko.observable();

    self.popupGameRecap = function (item) {
        self.getGameSummary(item.AwayTeamId(), item.Id(), self.awayGameSummary);
        self.getGameSummary(item.HomeTeamId(), item.Id(), self.homeGameSummary);

        self.homeTeamName(item.HomeTeamName());
        self.awayTeamName(item.AwayTeamName());

        $("#gameRecapModal").modal("show");
    };

    self.getGameSummary = function (teamId, gameId, observableSummary) {

        var url = window.config.rootUri + '/api/TeamStatisticsAPI/' + self.accountId + '/Team/' + teamId + '/gamesummary/' + gameId;

        $.ajax({
            type: "GET",
            url: url,
            success: function (gameSummary) {
                if (gameSummary) {
                    observableSummary(gameSummary);
                    if (self.homeGameSummary == observableSummary)
                        $('#statsTab a:first').tab('show') // Select first tab
                }
                else {
                    observableSummary("No Game Summary");
                    if (self.homeGameSummary == observableSummary)
                        $('#statsTab a:last').tab('show') // Select last tab
                }
            }
        });

    };

    self.setupMonthData = function (theDate) {

        if (!theDate || !theDate.valueOf()) {
            return;
        }

        self.loadingSchedule(true);

        theDate.setDate(1);

        self.currentDate(new Date(theDate));
        self.currentDate().setHours(0, 0, 0, 0);

        var startMonth = theDate.getMonth();

        // get back to "Sunday"
        var dayOfWeek = theDate.getDay();
        theDate.setDate(theDate.getDate() - dayOfWeek);
        theDate.setHours(0, 0, 0, 0);
        var startDate = new Date(theDate);// moment(theDate).format("YYYY-MM-DD");

        theDate = self.getEndDate(theDate, startMonth);
        theDate.setHours(0, 0, 0, 0);
        var endDate = new Date(theDate); //moment(theDate).format("YYYY-MM-DD");

        var url = window.config.rootUri + '/api/ScheduleAPI/' + self.accountId;
        if (self.selectedTeam()) {
            url += '/team/' + self.selectedTeam();
        }
        else {
            url += '/league/' + self.selectedLeague();
        }

        url += '/week?startDay=' + moment(startDate).format("YYYY-MM-DD") + '&endDay=' + moment(endDate).format("YYYY-MM-DD");

        $.ajax({
                type: "GET",
                url: url,
                success: function (games) {

                    self.gameMonth.removeAll();

                    var curDate = new Date(startDate);
                    var stopDate = new Date(endDate);

                    var curGameIndex = 0;

                    while (curDate < stopDate) {
                        var dayNo = 0;
                        var gameWeek = ko.observableArray();

                        while (dayNo < 7) {

                            var viewModel = new GameDayViewModel(curDate);
                            while (curGameIndex < games.length) {
                                var gameDate = new Date(games[curGameIndex].GameDate);
                                gameDate.setHours(0, 0, 0, 0);
                                if (gameDate <= curDate) {
                                    var curGame = games[curGameIndex];
                                    var gameViewModel = new GameViewModel(curGame, self.accountId);
                                    viewModel.games.push(gameViewModel);
                                    ++curGameIndex;
                                }
                                else
                                    break;
                            }
                            gameWeek.push(viewModel);
                            dayNo++;

                            curDate.setDate(curDate.getDate() + 1);
                        }

                        self.gameMonth.push(gameWeek);
                    }
                },
                complete: function () {
                    self.loadingSchedule(false);
                    self.viewMode(true);
                }
            });
    }

    self.addGameToCalendar = function (game) {

        if (self.selectedTeam()) {
            if (game.HomeTeamId != self.selectedTeam() &&
                game.AwayTeamId != self.selectedTeam())
                return;
        }

        // find the range of game dates shown, determine if the
        // given game is in that range.
        var startDate = new Date(self.currentDate());

        var startMonth = startDate.getMonth();

        // get back to "Sunday"
        var dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        var theDate = self.getEndDate(new Date(startDate), startMonth);
        var endDate = new Date(theDate);

        var gameDate = new Date(game.GameDate);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate >= startDate && gameDate <= endDate) {

            var curDate = new Date(startDate);

            var weekNo = 0;
            var gameDay = null;

            while (curDate <= gameDate) {
                var dayNo = 0;

                while (dayNo < 7) {

                    if (+curDate === +gameDate) {
                        var gameWeek = self.gameMonth()[weekNo];
                        gameDay = gameWeek()[dayNo];
                        break;
                    }

                    dayNo++;
                    curDate.setDate(curDate.getDate() + 1);
                }

                if (gameDay) {
                    if (gameDay.games().length == 0) {
                        var newGame = new GameViewModel(game, self.accountId);
                        gameDay.games.push(newGame);
                    }
                    else {
                        var newGame = new GameViewModel(game, self.accountId);
                        gameDay.games.push(newGame);
                        gameDay.games.sort(self.sortGamesByTime);
                    }
                    break;
                }

                weekNo++;
            }
        }
    }

    self.sortGamesByTime = function (g1, g2) {
        var t1 = new Date(g1.GameDate());
        var t2 = new Date(g2.GameDate());

        var hours1 = t1.getHours();
        var hours2 = t2.getHours();

        if (hours1 == hours2) {
            var mins1 = t1.getMinutes();
            var mins2 = t2.getMinutes();

            return mins1 == mins2 ? 0 : mins1 < mins2 ? -1 : 1;
        }
                            
        return hours1 == hours2 ? 0 : hours1 < hours2 ? -1 : 1;
    }

    self.getEndDate = function (theDate, startMonth) {
        // get each week for the given month.
        var doneGettingWeeks = false;
        var inCurrentMonth = false;
        while (!doneGettingWeeks) {
            // many times the start date is before the current
            // month. Track when we have entered the current
            // month.
            if (!inCurrentMonth && theDate.getMonth() == startMonth) {
                inCurrentMonth = true;
            }

            // move ahead one week.
            theDate.setDate(theDate.getDate() + 7);

            // if we are no longer in the current month and we 
            // were in the current month, we are done.
            if (inCurrentMonth && theDate.getMonth() != startMonth) {
                doneGettingWeeks = true;
            }
        }

        return theDate;
    }

    self.populateTeams = function () {
        if (self.selectedLeague() in self.teamsCache)
            self.leagueTeams(self.teamsCache[self.selectedLeague()]);
        else {

            $.ajax({
                type: "GET",
                url: window.config.rootUri + '/api/LeaguesAPI/' + self.accountId + '/teams/' + self.selectedLeague(),
                success: function (teams) {
                    self.teamsCache[self.selectedLeague()] = $.map(teams, function (team) {
                        return { Name: team.Name, Id: team.Id };
                    });

                    if (self.teamsCache[self.selectedLeague()].length == 0)
                        self.teamsCache[self.selectedLeague()] = [ { Name: '{no teams in league}', Id: 0 } ];

                    self.leagueTeams(self.teamsCache[self.selectedLeague()]);
                }
            });
        }
    }

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

    self.calendarViewSelected = function () {
        $.cookie('sched_view', 'calendar', { expires: 180 });
    }

    self.listViewSelected = function () {
        $.cookie('sched_view', 'list', { expires: 180 });
    }

    if ($.cookie('sched_last_selected_league')) {
        var cv = $.cookie('sched_last_selected_league');
        self.selectedLeague(cv);
    }

    self.isListDefaultView = function () {
        var v = $.cookie('sched_view');
        return (v && v == 'list') ? true : false;
    }

    $(".currentDate").datepicker({
        viewMode: 1,
        minViewMode: 1,
        autoclose: true
    }).on('changeDate', function (ev) {
        if (!self.loadingSchedule() && self.viewMode()) {
            var theDate = new Date(ev.date);
            var date = new Date(self.currentDate());
            if (theDate.getMonth() != date.getMonth() ||
                theDate.getYear() != date.getYear()) {
                date.setMonth(theDate.getMonth());
                date.setFullYear(theDate.getFullYear());

                self.setupMonthData(date);
            }
        }
    });
}